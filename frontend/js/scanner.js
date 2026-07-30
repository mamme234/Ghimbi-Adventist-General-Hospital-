// ============================================
   SCANNER MODULE - Barcode & QR Scanner
// ============================================

class Scanner {
    constructor(options = {}) {
        this.videoElement = null;
        this.stream = null;
        this.isScanning = false;
        this.onScan = options.onScan || null;
        this.onError = options.onError || null;
        this.scanInterval = options.interval || 500;
        this.formats = options.formats || ['qr_code', 'ean_13', 'ean_8', 'code_128'];
        this.intervalId = null;
    }

    // ============================================
    // INITIALIZE SCANNER
    // ============================================
    
    async initialize(videoElement) {
        try {
            this.videoElement = videoElement;
            
            // Check for camera support
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera not supported on this device');
            }

            // Get camera stream
            const constraints = {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.videoElement.srcObject = this.stream;
            await this.videoElement.play();

            // Start scanning
            this.startScanning();

            return true;
        } catch (error) {
            console.error('Scanner initialization error:', error);
            if (this.onError) {
                this.onError(error);
            }
            throw error;
        }
    }

    // ============================================
    // START SCANNING
    // ============================================
    
    startScanning() {
        if (this.isScanning) return;
        this.isScanning = true;

        // Use interval for scanning
        this.intervalId = setInterval(() => {
            this.scanFrame();
        }, this.scanInterval);
    }

    // ============================================
    // STOP SCANNING
    // ============================================
    
    stopScanning() {
        this.isScanning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.stopCamera();
    }

    // ============================================
    // SCAN FRAME
    // ============================================
    
    async scanFrame() {
        if (!this.videoElement || !this.isScanning) return;

        try {
            // Create canvas from video frame
            const canvas = document.createElement('canvas');
            canvas.width = this.videoElement.videoWidth;
            canvas.height = this.videoElement.videoHeight;
            const context = canvas.getContext('2d');
            context.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);

            // Detect barcode/QR
            const result = await this.detectBarcode(canvas);
            
            if (result) {
                this.stopScanning();
                if (this.onScan) {
                    this.onScan(result);
                }
            }
        } catch (error) {
            console.error('Scan frame error:', error);
        }
    }

    // ============================================
    // DETECT BARCODE USING LIBRARY
    // ============================================
    
    async detectBarcode(imageSource) {
        try {
            // Using QuaggaJS or similar library
            if (typeof Quagga !== 'undefined') {
                return this.detectWithQuagga(imageSource);
            }

            // Using ZXing or similar library
            if (typeof ZXing !== 'undefined') {
                return this.detectWithZXing(imageSource);
            }

            // Fallback to API
            return this.detectViaAPI(imageSource);
        } catch (error) {
            console.error('Barcode detection error:', error);
            return null;
        }
    }

    detectWithQuagga(imageSource) {
        return new Promise((resolve, reject) => {
            const canvas = imageSource instanceof HTMLCanvasElement ? 
                imageSource : this.imageToCanvas(imageSource);

            Quagga.decodeSingle({
                src: canvas.toDataURL('image/png'),
                numOfWorkers: 0,
                decoder: {
                    readers: ['code_128_reader', 'ean_reader', 'ean_8_reader', 'qr_reader']
                }
            }, (result) => {
                if (result && result.codeResult) {
                    resolve({
                        text: result.codeResult.code,
                        format: result.codeResult.format,
                        raw: result
                    });
                } else {
                    resolve(null);
                }
            });
        });
    }

    detectWithZXing(imageSource) {
        try {
            const canvas = imageSource instanceof HTMLCanvasElement ? 
                imageSource : this.imageToCanvas(imageSource);
            
            const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
            const source = ZXing.HTMLCanvasElementLuminanceSource.fromCanvas(canvas);
            const reader = new ZXing.MultiFormatReader();
            const result = reader.decode(source);

            if (result) {
                return {
                    text: result.text,
                    format: result.format,
                    raw: result
                };
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    async detectViaAPI(imageSource) {
        const formData = new FormData();
        const canvas = imageSource instanceof HTMLCanvasElement ? 
            imageSource : this.imageToCanvas(imageSource);
        
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        formData.append('image', blob);

        const response = await fetch('/api/scanner/detect', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        if (data.text) {
            return {
                text: data.text,
                format: data.format || 'unknown',
                raw: data
            };
        }
        return null;
    }

    // ============================================
    // IMAGE TO CANVAS CONVERTER
    // ============================================
    
    imageToCanvas(imageSource) {
        const canvas = document.createElement('canvas');
        const img = new Image();
        img.src = imageSource instanceof HTMLVideoElement ? 
            this.videoToImageDataURL(imageSource) : imageSource;
        
        canvas.width = img.width || 640;
        canvas.height = img.height || 480;
        const context = canvas.getContext('2d');
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        return canvas;
    }

    videoToImageDataURL(videoElement) {
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(videoElement, 0, 0);
        return canvas.toDataURL('image/png');
    }

    // ============================================
    // STOP CAMERA
    // ============================================
    
    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }
    }

    // ============================================
    // SCAN FROM IMAGE UPLOAD
    // ============================================
    
    async scanFromImage(file) {
        try {
            const imageUrl = URL.createObjectURL(file);
            const img = new Image();
            img.src = imageUrl;
            await new Promise(resolve => img.onload = resolve);

            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const context = canvas.getContext('2d');
            context.drawImage(img, 0, 0);

            const result = await this.detectBarcode(canvas);
            URL.revokeObjectURL(imageUrl);

            return result;
        } catch (error) {
            console.error('Image scan error:', error);
            throw error;
        }
    }

    // ============================================
    // VALIDATE SCAN RESULT
    // ============================================
    
    validateResult(result) {
        if (!result || !result.text) return false;
        
        // Check if it's a valid format
        const validFormats = ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e'];
        if (result.format && !validFormats.includes(result.format)) {
            return false;
        }

        // Validate EAN checksum
        if (result.format === 'ean_13' && !this.validateEAN13(result.text)) {
            return false;
        }

        return true;
    }

    validateEAN13(code) {
        if (!code || code.length !== 13) return false;
        
        let sum = 0;
        for (let i = 0; i < 12; i++) {
            const digit = parseInt(code[i]);
            sum += i % 2 === 0 ? digit : digit * 3;
        }
        const checkDigit = (10 - (sum % 10)) % 10;
        return parseInt(code[12]) === checkDigit;
    }

    // ============================================
    // TORCH / FLASHLIGHT
    // ============================================
    
    async toggleTorch() {
        if (!this.stream) return false;

        try {
            const videoTrack = this.stream.getVideoTracks()[0];
            if (!videoTrack) return false;

            const capabilities = videoTrack.getCapabilities();
            if (!capabilities.torch) {
                console.warn('Torch not supported on this device');
                return false;
            }

            const settings = videoTrack.getSettings();
            const newTorchState = !settings.torch;
            
            await videoTrack.applyConstraints({
                advanced: [{ torch: newTorchState }]
            });

            return newTorchState;
        } catch (error) {
            console.error('Torch toggle error:', error);
            return false;
        }
    }

    // ============================================
    // SWITCH CAMERA
    // ============================================
    
    async switchCamera() {
        if (!this.videoElement) return false;

        try {
            const currentTrack = this.stream.getVideoTracks()[0];
            const currentFacingMode = currentTrack.getSettings().facingMode || 'environment';
            const newFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';

            // Stop current stream
            this.stopCamera();

            // Start new stream with opposite camera
            const constraints = {
                video: {
                    facingMode: newFacingMode,
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.videoElement.srcObject = this.stream;
            await this.videoElement.play();

            // Resume scanning
            this.startScanning();

            return true;
        } catch (error) {
            console.error('Camera switch error:', error);
            return false;
        }
    }

    // ============================================
    // DESTROY SCANNER
    // ============================================
    
    destroy() {
        this.stopScanning();
        this.stopCamera();
        this.videoElement = null;
        this.onScan = null;
        this.onError = null;
    }
}

// ============================================
// CREATE GLOBAL INSTANCE
// ============================================
const scanner = new Scanner();
window.scanner = scanner;

// ============================================
// EXPORT
// ============================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Scanner;
    module.exports.scanner = scanner;
                }
