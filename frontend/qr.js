// ============================================
   QR CODE MODULE - Generate & Read QR Codes
// ============================================

class QRManager {
    constructor() {
        this.API_URL = window.API_URL || 'https://api.medicare.com';
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');
    }

    // ============================================
    // GENERATE QR CODE
    // ============================================
    
    async generateQRCode(data, options = {}) {
        try {
            const config = {
                size: options.size || 200,
                color: options.color || '#2563eb',
                bgColor: options.bgColor || '#ffffff',
                errorCorrection: options.errorCorrection || 'M',
                margin: options.margin || 2,
                ...options
            };

            // If QRCode library is available, use it
            if (typeof QRCode !== 'undefined') {
                return this.generateWithLibrary(data, config);
            }

            // Fallback to API generation
            return this.generateViaAPI(data, config);
        } catch (error) {
            console.error('QR generation error:', error);
            throw error;
        }
    }

    generateWithLibrary(data, config) {
        return new Promise((resolve, reject) => {
            try {
                const qr = new QRCode(this.canvas, {
                    text: data,
                    width: config.size,
                    height: config.size,
                    colorDark: config.color,
                    colorLight: config.bgColor,
                    correctLevel: QRCode.CorrectLevel[config.errorCorrection]
                });

                resolve(this.canvas.toDataURL('image/png'));
            } catch (error) {
                reject(error);
            }
        });
    }

    async generateViaAPI(data, config) {
        const url = `${this.API_URL}/qr/generate`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                data,
                size: config.size,
                color: config.color,
                bgColor: config.bgColor
            })
        });

        if (!response.ok) {
            throw new Error('Failed to generate QR code');
        }

        const blob = await response.blob();
        return URL.createObjectURL(blob);
    }

    // ============================================
    // GENERATE PATIENT QR CARD
    // ============================================
    
    async generatePatientCard(patientData) {
        try {
            const qrData = JSON.stringify({
                patientId: patientData.id,
                name: patientData.name,
                hospital: patientData.hospital || 'MediCare',
                type: 'patient-card'
            });

            const qrImage = await this.generateQRCode(qrData, {
                size: 300,
                color: '#2563eb'
            });

            // Create card with patient info and QR
            const card = document.createElement('div');
            card.className = 'patient-qr-card';
            card.innerHTML = `
                <div class="qr-card-content">
                    <div class="qr-card-header">
                        <img src="/images/logo.svg" alt="Hospital Logo" class="qr-card-logo">
                        <h3>Patient ID Card</h3>
                    </div>
                    <div class="qr-card-body">
                        <div class="qr-card-info">
                            <p><strong>Name:</strong> ${patientData.name}</p>
                            <p><strong>ID:</strong> ${patientData.id}</p>
                            <p><strong>Department:</strong> ${patientData.department || 'General'}</p>
                            <p><strong>Blood Group:</strong> ${patientData.bloodGroup || 'N/A'}</p>
                        </div>
                        <div class="qr-card-code">
                            <img src="${qrImage}" alt="QR Code" class="qr-code-image">
                        </div>
                    </div>
                    <div class="qr-card-footer">
                        <p>Scan to access medical records</p>
                        <span class="qr-valid-until">Valid until: ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                    </div>
                </div>
            `;

            return card;
        } catch (error) {
            console.error('Patient card generation error:', error);
            throw error;
        }
    }

    // ============================================
    // GENERATE PRESCRIPTION QR
    // ============================================
    
    async generatePrescriptionQR(prescriptionData) {
        try {
            const qrData = JSON.stringify({
                prescriptionId: prescriptionData.id,
                patientId: prescriptionData.patientId,
                doctorId: prescriptionData.doctorId,
                date: prescriptionData.date,
                medicines: prescriptionData.medicines.map(m => m.name),
                type: 'prescription'
            });

            return await this.generateQRCode(qrData, {
                size: 200,
                color: '#7c3aed'
            });
        } catch (error) {
            console.error('Prescription QR generation error:', error);
            throw error;
        }
    }

    // ============================================
    // READ QR CODE
    // ============================================
    
    async readQRCode(imageSource) {
        try {
            // If using a library like html5-qrcode
            if (typeof Html5Qrcode !== 'undefined') {
                return this.readWithLibrary(imageSource);
            }

            // Fallback to API
            return this.readViaAPI(imageSource);
        } catch (error) {
            console.error('QR read error:', error);
            throw error;
        }
    }

    readWithLibrary(imageSource) {
        return new Promise((resolve, reject) => {
            const html5QrCode = new Html5Qrcode('qr-reader');
            
            html5QrCode.scanFile(imageSource, true)
                .then(decodedText => {
                    resolve(decodedText);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    async readViaAPI(imageSource) {
        const formData = new FormData();
        formData.append('image', imageSource);

        const response = await fetch(`${this.API_URL}/qr/read`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to read QR code');
        }

        const data = await response.json();
        return data.text;
    }

    // ============================================
    // PARSE QR DATA
    // ============================================
    
    parseQRData(qrText) {
        try {
            const data = JSON.parse(qrText);
            return {
                type: data.type || 'unknown',
                data: data,
                isValid: true
            };
        } catch (e) {
            // Not JSON, treat as plain text
            return {
                type: 'text',
                data: qrText,
                isValid: true
            };
        }
    }

    // ============================================
    // SCAN WITH CAMERA
    // ============================================
    
    async scanWithCamera(videoElement, options = {}) {
        try {
            // Check for camera support
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera not supported');
            }

            // Get camera stream
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: options.facingMode || 'environment',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });

            // Set video source
            if (videoElement) {
                videoElement.srcObject = stream;
                await videoElement.play();
            }

            return stream;
        } catch (error) {
            console.error('Camera access error:', error);
            throw error;
        }
    }

    // ============================================
    // STOP CAMERA
    // ============================================
    
    stopCamera(videoElement) {
        if (videoElement && videoElement.srcObject) {
            const tracks = videoElement.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoElement.srcObject = null;
        }
    }

    // ============================================
    // CREATE QR SCANNER UI
    // ============================================
    
    createScannerUI(options = {}) {
        const container = document.createElement('div');
        container.className = 'qr-scanner-container';
        container.innerHTML = `
            <div class="scanner-overlay">
                <div class="scanner-frame">
                    <div class="scanner-corner top-left"></div>
                    <div class="scanner-corner top-right"></div>
                    <div class="scanner-corner bottom-left"></div>
                    <div class="scanner-corner bottom-right"></div>
                    <video id="scannerVideo" autoplay playsinline></video>
                </div>
                <div class="scanner-controls">
                    <button class="btn btn-secondary" id="stopScanner">
                        <i class="fas fa-stop"></i> Stop
                    </button>
                    <button class="btn btn-primary" id="captureQR">
                        <i class="fas fa-camera"></i> Capture
                    </button>
                    <button class="btn btn-secondary" id="uploadQR">
                        <i class="fas fa-upload"></i> Upload
                    </button>
                </div>
            </div>
        `;

        // Add styles
        const styles = document.createElement('style');
        styles.textContent = `
            .qr-scanner-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.9);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .scanner-frame {
                position: relative;
                max-width: 400px;
                width: 90%;
                aspect-ratio: 1;
                background: #000;
                border-radius: 16px;
                overflow: hidden;
            }
            .scanner-frame video {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            .scanner-corner {
                position: absolute;
                width: 30px;
                height: 30px;
                border: 4px solid #2563eb;
                z-index: 2;
            }
            .scanner-corner.top-left {
                top: 15px;
                left: 15px;
                border-right: none;
                border-bottom: none;
                border-radius: 4px 0 0 0;
            }
            .scanner-corner.top-right {
                top: 15px;
                right: 15px;
                border-left: none;
                border-bottom: none;
                border-radius: 0 4px 0 0;
            }
            .scanner-corner.bottom-left {
                bottom: 15px;
                left: 15px;
                border-right: none;
                border-top: none;
                border-radius: 0 0 0 4px;
            }
            .scanner-corner.bottom-right {
                bottom: 15px;
                right: 15px;
                border-left: none;
                border-top: none;
                border-radius: 0 0 4px 0;
            }
            .scanner-controls {
                position: absolute;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: 12px;
                z-index: 3;
            }
            .scanner-controls .btn {
                padding: 12px 20px;
                border-radius: 25px;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            @media (max-width: 768px) {
                .scanner-controls {
                    flex-wrap: wrap;
                    justify-content: center;
                }
                .scanner-controls .btn {
                    font-size: 12px;
                    padding: 10px 16px;
                }
            }
        `;
        document.head.appendChild(styles);

        return container;
    }

    // ============================================
    // DOWNLOAD QR CODE
    // ============================================
    
    downloadQR(qrImage, filename = 'qr-code.png') {
        const link = document.createElement('a');
        link.href = qrImage;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // ============================================
    // SHARE QR CODE
    // ============================================
    
    async shareQR(qrImage, title = 'QR Code') {
        try {
            if (navigator.share) {
                const response = await fetch(qrImage);
                const blob = await response.blob();
                const file = new File([blob], 'qr-code.png', { type: 'image/png' });
                
                await navigator.share({
                    title: title,
                    files: [file]
                });
                return true;
            } else {
                this.downloadQR(qrImage);
                return false;
            }
        } catch (error) {
            console.error('Share error:', error);
            if (error.name !== 'AbortError') {
                this.downloadQR(qrImage);
            }
            return false;
        }
    }
}

// ============================================
// CREATE GLOBAL INSTANCE
// ============================================
const qrManager = new QRManager();
window.qrManager = qrManager;

// ============================================
// EXPORT
// ============================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QRManager;
    module.exports.qrManager = qrManager;
              }
