import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { BottomSheet } from '../common/BottomSheet';
import { PantryItem, ShoppingItem, PlannedMealItem, MealSlot, StorageZone, UnitType } from '../../types';
import {
  Camera,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  StopCircle,
  Sparkles,
  RotateCw,
  ShoppingCart,
  Candy,
  Home,
  Check,
  Edit3,
} from 'lucide-react';
import { addDays, formatDate } from '../../constants/mockData';

export type ScannerTargetMode = 'any' | 'pantry' | 'shopping' | 'planner';

export interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMode?: ScannerTargetMode;
  shoppingList?: ShoppingItem[];
  onProductFound?: (productData: Omit<PantryItem, 'id'>) => void;
  onScanShoppingItem?: (product: {
    name: string;
    amount?: number;
    unit?: UnitType;
    category?: string;
    price?: number;
    kcalPer100g?: number;
    proteinPer100g?: number;
    fatPer100g?: number;
    carbsPer100g?: number;
    barcode?: string;
    zone?: StorageZone;
    shelfLifeDays?: number;
  }) => { matched: boolean; matchedName?: string | null };
  onScanPlannerMeal?: (meal: Omit<PlannedMealItem, 'id'>) => void;
}

export interface EditableScannedProduct {
  code: string;
  name: string;
  brand: string;
  quantity: string;
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  category: string;
  zone: StorageZone;
  image?: string;
  source?: string;
}

export function BarcodeScannerModal({
  isOpen,
  onClose,
  targetMode = 'any',
  shoppingList = [],
  onProductFound,
  onScanShoppingItem,
  onScanPlannerMeal,
}: BarcodeScannerModalProps) {
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scannedProduct, setScannedProduct] = useState<EditableScannedProduct | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [laserOrientation, setLaserOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

  // Meal slot for snack logging
  const [selectedMealSlot, setSelectedMealSlot] = useState<MealSlot>('second_breakfast');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scannerContainerId = 'interactive-barcode-scanner';

  // Helper to safely stop the scanner
  const stopScanningSafely = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      } finally {
        html5QrCodeRef.current = null;
      }
    }
    setIsScanning(false);
    setIsStarting(false);
  };

  // Reset state on close or unmount
  useEffect(() => {
    if (!isOpen) {
      stopScanningSafely();
      setScannedProduct(null);
      setErrorMsg(null);
      setManualCode('');
      setPermissionDenied(false);
      setIsAiProcessing(false);
    }
    return () => {
      stopScanningSafely();
    };
  }, [isOpen]);

  // Check if scanned product matches something on the user's shopping list
  const matchingShoppingItem = useMemo(() => {
    if (!scannedProduct || !scannedProduct.name || !shoppingList) return null;
    const cleanScanName = scannedProduct.name.toLowerCase().trim();
    return (
      shoppingList.find(
        item =>
          !item.checked &&
          (item.name.toLowerCase().trim() === cleanScanName ||
            cleanScanName.includes(item.name.toLowerCase().trim()) ||
            item.name.toLowerCase().trim().includes(cleanScanName))
      ) || null
    );
  }, [scannedProduct, shoppingList]);

  const handleLookup = async (code: string) => {
    const trimmed = code.trim().replace(/\s+/g, '');
    if (!trimmed) return;
    setLoading(true);
    setErrorMsg(null);
    setScannedProduct(null);

    try {
      const res = await fetch(`/api/openfoodfacts/barcode/${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (data.found && data.product) {
        setScannedProduct({
          code: data.product.code || trimmed,
          name: data.product.name === 'Produkt zeskanowany' ? '' : data.product.name || '',
          brand: data.product.brand || '',
          quantity: data.product.quantity || '100 g',
          kcalPer100g: Number(data.product.kcalPer100g) || 0,
          proteinPer100g: Number(data.product.proteinPer100g) || 0,
          fatPer100g: Number(data.product.fatPer100g) || 0,
          carbsPer100g: Number(data.product.carbsPer100g) || 0,
          category: data.product.category || 'Inne',
          zone: (data.product.zone as StorageZone) || 'fridge',
          image: data.product.image || '',
          source: data.source || '',
        });
      } else {
        // Allow immediate manual entry with pre-filled code
        setScannedProduct({
          code: trimmed,
          name: '',
          brand: '',
          quantity: '1 szt',
          kcalPer100g: 0,
          proteinPer100g: 0,
          fatPer100g: 0,
          carbsPer100g: 0,
          category: 'Inne',
          zone: 'fridge',
        });
        setErrorMsg(`Kod ${trimmed} nie został jeszcze skatalogowany. Wpisz nazwę poniżej:`);
      }
    } catch (err: any) {
      setErrorMsg('Błąd połączenia z bazą kodów. Wpisz dane ręcznie.');
      setScannedProduct({
        code: trimmed,
        name: '',
        brand: '',
        quantity: '1 szt',
        kcalPer100g: 0,
        proteinPer100g: 0,
        fatPer100g: 0,
        carbsPer100g: 0,
        category: 'Inne',
        zone: 'fridge',
      });
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    setErrorMsg(null);
    setPermissionDenied(false);
    setScannedProduct(null);
    setIsStarting(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Aparat nie jest obsługiwany w tym oknie przeglądarki. Użyj opcji „Zrób zdjęcie” lub wpisz kod ręcznie.');
      }

      await stopScanningSafely();

      const scanner = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
        verbose: false,
      });
      html5QrCodeRef.current = scanner;

      const onScanSuccess = async (decodedText: string) => {
        await stopScanningSafely();
        handleLookup(decodedText);
      };

      const qrConfig = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const edge = Math.min(viewfinderWidth, viewfinderHeight);
          const size = Math.min(Math.floor(edge * 0.75), 250);
          return { width: size, height: size };
        },
        aspectRatio: 1.0,
      };

      try {
        await scanner.start(
          { facingMode: 'environment' },
          qrConfig,
          onScanSuccess,
          () => {}
        );
        setIsStarting(false);
        setIsScanning(true);
        return;
      } catch (modeErr) {
        console.warn('facingMode environment failed, trying camera enumeration:', modeErr);
      }

      const cameras = await Html5Qrcode.getCameras();
      if (cameras && cameras.length > 0) {
        const backCamera = cameras.find(c =>
          c.label.toLowerCase().includes('back') ||
          c.label.toLowerCase().includes('tył') ||
          c.label.toLowerCase().includes('environment')
        ) || cameras[cameras.length - 1];

        await scanner.start(
          backCamera.id,
          qrConfig,
          onScanSuccess,
          () => {}
        );
        setIsStarting(false);
        setIsScanning(true);
      } else {
        throw new Error('Nie znaleziono kamery w tym urządzeniu.');
      }
    } catch (err: any) {
      console.error('Camera activation error:', err);
      await stopScanningSafely();
      const isDenied =
        err?.name === 'NotAllowedError' ||
        err?.message?.includes('Permission') ||
        err?.message?.includes('denied');

      setPermissionDenied(isDenied);
      setErrorMsg(
        isDenied
          ? 'Dostęp do aparatu jest zablokowany. Skorzystaj z przycisku „Zrób zdjęcie AI” lub wpisz kod.'
          : err?.message || 'Nie udało się uruchomić wideo. Użyj opcji zdjęcia lub wpisz kod.'
      );
    }
  };

  // Helper to resize/compress image before sending to AI
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Photo Scan: Barcode detector first, Gemini AI Vision fallback
  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setErrorMsg(null);
    setScannedProduct(null);

    try {
      await stopScanningSafely();

      let scanner = html5QrCodeRef.current;
      if (!scanner) {
        scanner = new Html5Qrcode(scannerContainerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
          verbose: false,
        });
        html5QrCodeRef.current = scanner;
      }

      let barcodeFound = false;
      try {
        const decodedText = await scanner.scanFile(file, true);
        if (decodedText) {
          barcodeFound = true;
          await handleLookup(decodedText);
          return;
        }
      } catch (scanErr) {
        console.warn('Direct barcode scan on photo failed, falling back to Gemini Vision:', scanErr);
      }

      if (!barcodeFound) {
        setIsAiProcessing(true);
        const compressedBase64 = await compressImage(file);
        const response = await fetch('/api/gemini/scan-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: compressedBase64,
            mimeType: 'image/jpeg',
          }),
        });

        const data = await response.json();
        if (data.success && data.product) {
          setScannedProduct({
            code: data.product.barcode || manualCode || 'ai-vision',
            name: data.product.name || '',
            brand: data.product.brand || '',
            quantity: data.product.quantity || '1 szt',
            kcalPer100g: Number(data.product.kcalPer100g) || 0,
            proteinPer100g: Number(data.product.proteinPer100g) || 0,
            fatPer100g: Number(data.product.fatPer100g) || 0,
            carbsPer100g: Number(data.product.carbsPer100g) || 0,
            category: data.product.category || 'Inne',
            zone: (data.product.zone as StorageZone) || 'fridge',
            image: '',
            source: 'gemini-vision',
          });
          return;
        } else {
          setErrorMsg('Nie udało się odczytać kodu ze zdjęcia. Możesz wpisać nazwę i kod poniżej ręcznie.');
          setScannedProduct({
            code: manualCode || 'reczny',
            name: '',
            brand: '',
            quantity: '1 szt',
            kcalPer100g: 0,
            proteinPer100g: 0,
            fatPer100g: 0,
            carbsPer100g: 0,
            category: 'Inne',
            zone: 'fridge',
          });
        }
      }
    } catch (err: any) {
      console.warn('File scan error:', err);
      setErrorMsg('Wystąpił błąd podczas analizy zdjęcia. Wpisz dane produktu ręcznie.');
    } finally {
      setLoading(false);
      setIsAiProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Helper to determine parsed amount & unit
  const parseAmountAndUnit = (qtyStr: string, cat: string, prodName: string) => {
    const isLiquid =
      qtyStr?.toLowerCase().includes('ml') ||
      cat === 'Napoje' ||
      prodName?.toLowerCase().includes('napój') ||
      prodName?.toLowerCase().includes('sok') ||
      prodName?.toLowerCase().includes('mleko');

    const numMatch = qtyStr?.match(/(\d+)/);
    const parsedNum = numMatch ? parseInt(numMatch[1], 10) : isLiquid ? 500 : 250;
    const defaultUnit: UnitType = isLiquid ? 'ml' : qtyStr?.toLowerCase().includes('g') ? 'g' : 'szt';

    return { amount: parsedNum, unit: defaultUnit };
  };

  // ACTION 1: Add to Pantry
  const handleSaveToPantry = () => {
    if (!scannedProduct) return;
    const name = scannedProduct.name.trim() || 'Produkt bez nazwy';
    const { amount, unit } = parseAmountAndUnit(scannedProduct.quantity, scannedProduct.category, name);

    if (onProductFound) {
      onProductFound({
        name,
        zone: scannedProduct.zone || 'fridge',
        category: scannedProduct.category || 'Inne',
        currentAmount: amount,
        totalAmount: amount,
        unit,
        expiryDate: addDays(60),
        kcalPer100g: scannedProduct.kcalPer100g || 0,
        proteinPer100g: scannedProduct.proteinPer100g || 0,
        fatPer100g: scannedProduct.fatPer100g || 0,
        carbsPer100g: scannedProduct.carbsPer100g || 0,
        price: 3.99,
        barcode: scannedProduct.code,
      });
    }
    onClose();
  };

  // ACTION 2: Shopping Mode (Check off shopping list & send to pantry)
  const handleSaveShoppingItem = () => {
    if (!scannedProduct) return;
    const name = scannedProduct.name.trim() || matchingShoppingItem?.name || 'Produkt z zakupów';
    const { amount, unit } = parseAmountAndUnit(scannedProduct.quantity, scannedProduct.category, name);

    if (onScanShoppingItem) {
      onScanShoppingItem({
        name,
        amount,
        unit,
        category: scannedProduct.category || 'Inne',
        price: 3.99,
        kcalPer100g: scannedProduct.kcalPer100g || 0,
        proteinPer100g: scannedProduct.proteinPer100g || 0,
        fatPer100g: scannedProduct.fatPer100g || 0,
        carbsPer100g: scannedProduct.carbsPer100g || 0,
        barcode: scannedProduct.code,
        zone: scannedProduct.zone || 'fridge',
        shelfLifeDays: 30,
      });
    } else if (onProductFound) {
      onProductFound({
        name,
        zone: scannedProduct.zone || 'fridge',
        category: scannedProduct.category || 'Inne',
        currentAmount: amount,
        totalAmount: amount,
        unit,
        expiryDate: addDays(30),
        kcalPer100g: scannedProduct.kcalPer100g || 0,
        proteinPer100g: scannedProduct.proteinPer100g || 0,
        fatPer100g: scannedProduct.fatPer100g || 0,
        carbsPer100g: scannedProduct.carbsPer100g || 0,
        barcode: scannedProduct.code,
      });
    }
    onClose();
  };

  // ACTION 3: Planner Snack Mode (Eaten on the go / in the city)
  const handleSavePlannerSnack = () => {
    if (!scannedProduct) return;
    const name = scannedProduct.name.trim() || 'Przekąska na mieście';
    const { amount, unit } = parseAmountAndUnit(scannedProduct.quantity, scannedProduct.category, name);

    // Calculate portion macros based on quantity
    const factor = amount > 0 && unit !== 'szt' ? amount / 100 : 1;
    const portionKcal = Math.round((scannedProduct.kcalPer100g || 0) * factor);
    const portionProtein = Number(((scannedProduct.proteinPer100g || 0) * factor).toFixed(1));
    const portionFat = Number(((scannedProduct.fatPer100g || 0) * factor).toFixed(1));
    const portionCarbs = Number(((scannedProduct.carbsPer100g || 0) * factor).toFixed(1));

    if (onScanPlannerMeal) {
      onScanPlannerMeal({
        name,
        amount,
        unit,
        kcal: portionKcal || 150,
        protein: portionProtein,
        fat: portionFat,
        carbs: portionCarbs,
        mealSlot: selectedMealSlot,
        date: formatDate(new Date()),
        isPantrySource: false, // Eaten on the street, does not reduce home pantry
      });
    }
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Skaner"
      id="modal-barcode-scanner"
    >
      <div className="space-y-4">
        {/* Hidden file input for native camera snapshot / photo upload */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleFileScan}
          className="hidden"
          id="file-barcode-input"
        />

        {/* Viewport Container */}
        <div className="relative w-full rounded-2xl overflow-hidden bg-[#181614] border border-[#302722] shadow-inner">
          <div
            id={scannerContainerId}
            className="w-full min-h-[220px] max-h-[260px] aspect-4/3 flex items-center justify-center bg-[#181614]"
          />

          {/* Cover Screen when camera is not running */}
          {!isScanning && !isStarting && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-5 bg-[#201A16] text-white text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#2D241F] flex items-center justify-center mb-3 border border-[#3E322B]">
                <Camera className="w-6 h-6 text-[#D68C7A]" />
              </div>
              <p className="text-sm font-bold text-[#F5F2EB] mb-4">
                Skieruj aparat na kod kreskowy
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2 w-full max-w-xs">
                <button
                  type="button"
                  onClick={startCamera}
                  className="flex-1 min-w-[130px] px-3.5 py-2.5 bg-[#D68C7A] hover:bg-[#C27866] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
                  id="btn-start-camera"
                >
                  <Camera className="w-4 h-4" />
                  Włącz aparat
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 min-w-[130px] px-3.5 py-2.5 bg-[#2F2722] hover:bg-[#3D332D] text-[#E3D5CA] text-xs font-bold rounded-xl border border-[#483B33] transition-all flex items-center justify-center gap-1.5 active:scale-95"
                  id="btn-snap-photo"
                  title="Wybierz lub zrób zdjęcie"
                >
                  <Sparkles className="w-4 h-4 text-[#D68C7A]" />
                  Zdjęcie
                </button>
              </div>
            </div>
          )}

          {/* Loading Overlay */}
          {(isStarting || isAiProcessing || loading) && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 bg-[#181614]/95 text-white backdrop-blur-xs">
              <Loader2 className="w-8 h-8 text-[#D68C7A] animate-spin mb-2" />
              <p className="text-xs font-bold text-[#F5F2EB]">
                {isAiProcessing
                  ? 'Rozpoznawanie produktu...'
                  : isStarting
                  ? 'Uruchamianie aparatu...'
                  : 'Pobieranie informacji...'}
              </p>
            </div>
          )}

          {/* Active Scanning Overlay */}
          {isScanning && (
            <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center p-3">
              <div className="w-52 h-52 border-2 border-[#D68C7A]/90 rounded-2xl relative shadow-[0_0_20px_rgba(214,140,122,0.4)] flex items-center justify-center">
                <div
                  className={`absolute left-2 right-2 h-0.5 bg-[#E89E8D] shadow-[0_0_8px_#D68C7A] top-1/2 -translate-y-1/2 ${
                    laserOrientation === 'horizontal' ? 'opacity-100 animate-pulse' : 'opacity-30'
                  }`}
                />
                <div
                  className={`absolute top-2 bottom-2 w-0.5 bg-[#E89E8D] shadow-[0_0_8px_#D68C7A] left-1/2 -translate-x-1/2 ${
                    laserOrientation === 'vertical' ? 'opacity-100 animate-pulse' : 'opacity-30'
                  }`}
                />
              </div>

              <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-white bg-black/85 px-3 py-1.5 rounded-full backdrop-blur-xs text-center max-w-[300px]">
                <RotateCw className="w-3.5 h-3.5 text-[#D68C7A] shrink-0" />
                <span>
                  {laserOrientation === 'horizontal'
                    ? 'Ustaw kod w poprzek poziomej linii'
                    : 'Ustaw kod w poprzek pionowej linii'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action button when scanning is active */}
        {isScanning && (
          <div className="flex flex-wrap justify-between items-center gap-2">
            <button
              type="button"
              onClick={() => setLaserOrientation(prev => (prev === 'horizontal' ? 'vertical' : 'horizontal'))}
              className="px-3 py-2 bg-[#FAF6F0] hover:bg-[#F3ECE0] text-[#4A443E] text-xs font-bold rounded-xl flex items-center gap-1.5 border border-[#EBE6DF] active:scale-95"
            >
              <RotateCw className="w-3.5 h-3.5 text-[#D68C7A]" />
              Zmień linię ({laserOrientation === 'horizontal' ? 'Pozioma' : 'Pionowa'})
            </button>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 bg-[#FAF6F0] hover:bg-[#F3ECE0] text-[#4A443E] text-xs font-bold rounded-xl flex items-center gap-1.5 border border-[#EBE6DF]"
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#D68C7A]" />
                Zrób zdjęcie AI
              </button>
              <button
                type="button"
                onClick={stopScanningSafely}
                className="px-3 py-2 bg-[#F7ECE8] text-[#B85D48] text-xs font-bold rounded-xl flex items-center gap-1.5 border border-[#E8D4CE]"
                id="btn-stop-camera"
              >
                <StopCircle className="w-3.5 h-3.5" />
                Zatrzymaj
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 bg-[#FDF2F0] text-[#B85D48] text-xs rounded-2xl flex items-start gap-2.5 border border-[#F2D0C8]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#D68C7A]" />
            <div className="space-y-1 flex-1">
              <p className="font-semibold leading-relaxed">{errorMsg}</p>
              {permissionDenied && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-[#D68C7A] underline block mt-1"
                >
                  📸 Zrób zdjęcie aparatem telefonu
                </button>
              )}
            </div>
          </div>
        )}

        {/* Manual code search */}
        <div className="p-3 bg-[#FAF6F0] rounded-2xl border border-[#EBE6DF]">
          <label className="block text-xs font-bold text-[#4A443E] mb-1.5">
            Wpisz kod EAN lub szukaj produktu:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              placeholder="np. 5907180333766 (Baza owocowa)"
              className="flex-1 px-3 py-2 text-xs bg-white border border-[#EBE6DF] rounded-xl text-[#4A443E] focus:outline-none focus:ring-1 focus:ring-[#D68C7A]"
              id="input-manual-barcode"
            />
            <button
              type="button"
              onClick={() => handleLookup(manualCode)}
              disabled={loading || !manualCode.trim()}
              className="px-4 py-2 bg-[#D68C7A] text-white text-xs font-bold rounded-xl hover:bg-[#C27866] disabled:opacity-50 transition-colors flex items-center gap-1 shrink-0"
              id="btn-submit-manual-barcode"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Szukaj
            </button>
          </div>
        </div>

        {/* Scanned / Editable Product Card */}
        {scannedProduct && (
          <div className="p-4 bg-white rounded-2xl border-2 border-[#7B8A75] shadow-md space-y-3 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#7B8A75] text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                {scannedProduct.name ? 'Rozpoznano produkt!' : 'Wpisz dane produktu:'}
              </div>
              <span className="text-[10px] text-[#9A8F85] font-mono bg-[#FAF6F0] px-2 py-0.5 rounded-md border border-[#EBE6DF]">
                kod: {scannedProduct.code}
              </span>
            </div>

            {/* Editable Product Name Field */}
            <div>
              <label className="block text-[11px] font-bold text-[#4A443E] mb-1 flex items-center gap-1">
                <Edit3 className="w-3.5 h-3.5 text-[#D68C7A]" />
                Nazwa produktu:
                <span className="text-[#9A8F85] font-normal text-[10px]">(możesz edytować)</span>
              </label>
              <input
                type="text"
                value={scannedProduct.name}
                onChange={e => setScannedProduct({ ...scannedProduct, name: e.target.value })}
                placeholder="np. Baza owocowa z sokiem z cytryny"
                className="w-full px-3 py-2 text-xs font-bold bg-[#FAF6F0] border border-[#EBE6DF] focus:border-[#D68C7A] rounded-xl text-[#4A443E] focus:outline-none focus:ring-1 focus:ring-[#D68C7A]"
                id="input-editable-product-name"
              />
            </div>

            {/* Brand & Quantity row */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-[#7A6F66] mb-1">
                  Marka / Producent:
                </label>
                <input
                  type="text"
                  value={scannedProduct.brand}
                  onChange={e => setScannedProduct({ ...scannedProduct, brand: e.target.value })}
                  placeholder="np. GoBio, Biedronka"
                  className="w-full px-2.5 py-1.5 text-xs bg-[#FAF6F0] border border-[#EBE6DF] rounded-xl text-[#4A443E] focus:outline-none focus:ring-1 focus:ring-[#D68C7A]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#7A6F66] mb-1">
                  Waga / Pojemność:
                </label>
                <input
                  type="text"
                  value={scannedProduct.quantity}
                  onChange={e => setScannedProduct({ ...scannedProduct, quantity: e.target.value })}
                  placeholder="np. 100g, 500ml"
                  className="w-full px-2.5 py-1.5 text-xs bg-[#FAF6F0] border border-[#EBE6DF] rounded-xl text-[#4A443E] focus:outline-none focus:ring-1 focus:ring-[#D68C7A]"
                />
              </div>
            </div>

            {/* Macros summary in 100g */}
            <div className="grid grid-cols-4 gap-1 text-center bg-[#FDFBF7] p-2 rounded-xl text-[11px] border border-[#EBE6DF]">
              <div>
                <span className="text-[#9A8F85] block text-[9px]">Kcal / 100g</span>
                <input
                  type="number"
                  value={scannedProduct.kcalPer100g}
                  onChange={e => setScannedProduct({ ...scannedProduct, kcalPer100g: Number(e.target.value) || 0 })}
                  className="w-full text-center font-bold text-[#D68C7A] bg-transparent text-xs focus:outline-none"
                />
              </div>
              <div>
                <span className="text-[#9A8F85] block text-[9px]">Białko (g)</span>
                <input
                  type="number"
                  step="0.1"
                  value={scannedProduct.proteinPer100g}
                  onChange={e => setScannedProduct({ ...scannedProduct, proteinPer100g: Number(e.target.value) || 0 })}
                  className="w-full text-center font-bold text-[#4A443E] bg-transparent text-xs focus:outline-none"
                />
              </div>
              <div>
                <span className="text-[#9A8F85] block text-[9px]">Tłuszcz (g)</span>
                <input
                  type="number"
                  step="0.1"
                  value={scannedProduct.fatPer100g}
                  onChange={e => setScannedProduct({ ...scannedProduct, fatPer100g: Number(e.target.value) || 0 })}
                  className="w-full text-center font-bold text-[#4A443E] bg-transparent text-xs focus:outline-none"
                />
              </div>
              <div>
                <span className="text-[#9A8F85] block text-[9px]">Węgle (g)</span>
                <input
                  type="number"
                  step="0.1"
                  value={scannedProduct.carbsPer100g}
                  onChange={e => setScannedProduct({ ...scannedProduct, carbsPer100g: Number(e.target.value) || 0 })}
                  className="w-full text-center font-bold text-[#4A443E] bg-transparent text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Shopping List match notification */}
            {matchingShoppingItem && (
              <div className="p-2.5 bg-[#F0F5EE] border border-[#7B8A75]/30 rounded-xl flex items-center gap-2 text-xs text-[#44563E]">
                <CheckCircle2 className="w-4 h-4 text-[#7B8A75] shrink-0" />
                <span>
                  Ten produkt jest na Twojej liście zakupów: <strong>"{matchingShoppingItem.name}"</strong>
                </span>
              </div>
            )}

            {/* DESTINATION ACTIONS */}
            <div className="pt-2 border-t border-[#EBE6DF] space-y-2">
              {/* ACTION 1: Shopping list check-off + transfer to pantry */}
              <button
                type="button"
                onClick={handleSaveShoppingItem}
                className={`w-full py-2.5 px-3.5 rounded-xl font-bold text-xs flex items-center justify-between transition-all shadow-2xs active:scale-[0.98] ${
                  targetMode === 'shopping' || matchingShoppingItem
                    ? 'bg-[#5E8271] hover:bg-[#4E6F5F] text-white ring-2 ring-[#7B8A75]/40'
                    : 'bg-[#F2F7F0] hover:bg-[#E5EFE2] text-[#44563E] border border-[#D3E4CE]'
                }`}
                id="btn-scan-action-shopping"
              >
                <div className="flex items-center gap-2 text-left">
                  <ShoppingCart className="w-4 h-4 shrink-0" />
                  <span className="block leading-snug">
                    {matchingShoppingItem ? 'Odhacz na liście zakupów i dodaj do spiżarni' : 'Lista zakupów i spiżarnia'}
                  </span>
                </div>
                <Check className="w-4 h-4 shrink-0" />
              </button>

              {/* ACTION 2: Planner Meal / Snack */}
              <div
                className={`p-2.5 rounded-xl border transition-all ${
                  targetMode === 'planner'
                    ? 'bg-[#FAF3EC] border-[#D68C7A] text-[#4A443E]'
                    : 'bg-[#FDFBF7] border-[#EBE6DF] text-[#4A443E]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#B85D48]">
                    <Candy className="w-4 h-4 text-[#D68C7A]" />
                    <span>Planer posiłków</span>
                  </div>
                  <span className="text-[10px] text-[#9A8F85]">
                    ~{Math.round((scannedProduct.kcalPer100g || 0) * (scannedProduct.quantity.includes('100') ? 1 : 0.5) || 100)} kcal
                  </span>
                </div>

                <div className="flex items-center gap-1 mb-2">
                  <span className="text-[10px] text-[#7A6F66] mr-1">Pora:</span>
                  {(
                    [
                      { id: 'second_breakfast', label: 'Przekąska' },
                      { id: 'lunch', label: 'Obiad' },
                      { id: 'dinner', label: 'Kolacja' },
                      { id: 'breakfast', label: 'Śniadanie' },
                    ] as { id: MealSlot; label: string }[]
                  ).map(slot => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedMealSlot(slot.id)}
                      className={`px-2 py-1 text-[10px] rounded-lg font-medium transition-colors ${
                        selectedMealSlot === slot.id
                          ? 'bg-[#D68C7A] text-white font-bold'
                          : 'bg-white text-[#7A6F66] border border-[#EBE6DF]'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleSavePlannerSnack}
                  className="w-full py-2 bg-[#D68C7A] hover:bg-[#C27866] text-white font-bold text-xs rounded-lg transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                  id="btn-scan-action-planner"
                >
                  <Candy className="w-3.5 h-3.5" />
                  Dodaj do posiłków
                </button>
              </div>

              {/* ACTION 3: Direct to Pantry */}
              <button
                type="button"
                onClick={handleSaveToPantry}
                className="w-full py-2.5 px-3.5 bg-white hover:bg-[#FAF6F0] text-[#4A443E] border border-[#EBE6DF] rounded-xl font-bold text-xs flex items-center justify-between transition-colors shadow-2xs"
                id="btn-scan-action-pantry"
              >
                <div className="flex items-center gap-2 text-left">
                  <Home className="w-4 h-4 text-[#7A6F66]" />
                  <span className="block leading-snug">Dodaj do spiżarni</span>
                </div>
                <span className="text-xs text-[#7B8A75] font-bold">+ Dodaj</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
