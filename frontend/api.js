// ============================================
   API MODULE - Connect Frontend to Backend
// ============================================

class API {
    constructor(config = {}) {
        this.baseURL = config.baseURL || 'http://localhost:3000/api';
        this.timeout = config.timeout || 30000;
        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...config.headers
        };
        this.authToken = null;
    }

    // ============================================
    // AUTHENTICATION
    // ============================================
    
    setAuthToken(token) {
        this.authToken = token;
        if (token) {
            this.headers['Authorization'] = `Bearer ${token}`;
        } else {
            delete this.headers['Authorization'];
        }
    }

    getAuthToken() {
        return this.authToken;
    }

    // ============================================
    // REQUEST METHODS
    // ============================================
    
    async request(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
        
        const config = {
            ...options,
            headers: {
                ...this.headers,
                ...options.headers
            }
        };

        // Add timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        config.signal = controller.signal;

        try {
            const response = await fetch(url, config);
            clearTimeout(timeoutId);

            // Handle response
            const data = await this.parseResponse(response);
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }

    async parseResponse(response) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else if (contentType && contentType.includes('application/pdf')) {
            return await response.blob();
        } else if (contentType && contentType.includes('text/plain')) {
            return await response.text();
        } else {
            return await response.blob();
        }
    }

    // ============================================
    // HTTP METHODS
    // ============================================
    
    get(endpoint, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'GET'
        });
    }

    post(endpoint, data = null, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: data ? JSON.stringify(data) : null
        });
    }

    put(endpoint, data = null, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: data ? JSON.stringify(data) : null
        });
    }

    patch(endpoint, data = null, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PATCH',
            body: data ? JSON.stringify(data) : null
        });
    }

    delete(endpoint, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'DELETE'
        });
    }

    // ============================================
    // FILE UPLOAD
    // ============================================
    
    upload(endpoint, file, onProgress = null, options = {}) {
        const formData = new FormData();
        formData.append('file', file);

        return this.request(endpoint, {
            ...options,
            method: 'POST',
            headers: {
                ...this.headers,
                'Content-Type': 'multipart/form-data'
            },
            body: formData,
            onUploadProgress: onProgress
        });
    }

    // ============================================
    // API ENDPOINTS - PUBLIC
    // ============================================
    
    // Auth endpoints
    async login(credentials) {
        return this.post('/auth/login', credentials);
    }

    async register(userData) {
        return this.post('/auth/register', userData);
    }

    async logout() {
        return this.post('/auth/logout');
    }

    async refreshToken(refreshToken) {
        return this.post('/auth/refresh', { refreshToken });
    }

    async resetPassword(email) {
        return this.post('/auth/reset-password', { email });
    }

    async changePassword(data) {
        return this.post('/auth/change-password', data);
    }

    async verifyEmail(token) {
        return this.get(`/auth/verify-email/${token}`);
    }

    // ============================================
    // API ENDPOINTS - PATIENT
    // ============================================
    
    // Patient Profile
    async getPatientProfile(patientId) {
        return this.get(`/patients/${patientId}`);
    }

    async updatePatientProfile(patientId, data) {
        return this.put(`/patients/${patientId}`, data);
    }

    async getPatientMedicalRecords(patientId) {
        return this.get(`/patients/${patientId}/records`);
    }

    async getPatientPrescriptions(patientId) {
        return this.get(`/patients/${patientId}/prescriptions`);
    }

    async getPatientLabResults(patientId) {
        return this.get(`/patients/${patientId}/laboratory`);
    }

    async getPatientRadiologyResults(patientId) {
        return this.get(`/patients/${patientId}/radiology`);
    }

    // Appointments
    async getAppointments(patientId, filters = {}) {
        const query = new URLSearchParams(filters).toString();
        return this.get(`/patients/${patientId}/appointments?${query}`);
    }

    async createAppointment(patientId, data) {
        return this.post(`/patients/${patientId}/appointments`, data);
    }

    async updateAppointment(patientId, appointmentId, data) {
        return this.put(`/patients/${patientId}/appointments/${appointmentId}`, data);
    }

    async cancelAppointment(patientId, appointmentId) {
        return this.delete(`/patients/${patientId}/appointments/${appointmentId}`);
    }

    // Billing
    async getPatientBills(patientId) {
        return this.get(`/patients/${patientId}/bills`);
    }

    async payBill(patientId, billId, paymentData) {
        return this.post(`/patients/${patientId}/bills/${billId}/pay`, paymentData);
    }

    // ============================================
    // API ENDPOINTS - DOCTOR
    // ============================================
    
    // Doctor Profile
    async getDoctorProfile(doctorId) {
        return this.get(`/doctors/${doctorId}`);
    }

    async getDoctorSchedule(doctorId, date) {
        return this.get(`/doctors/${doctorId}/schedule?date=${date}`);
    }

    async updateDoctorSchedule(doctorId, schedule) {
        return this.put(`/doctors/${doctorId}/schedule`, schedule);
    }

    // Patient Queue
    async getPatientQueue(doctorId, filters = {}) {
        const query = new URLSearchParams(filters).toString();
        return this.get(`/doctors/${doctorId}/queue?${query}`);
    }

    async startConsultation(doctorId, patientId) {
        return this.post(`/doctors/${doctorId}/consultations/${patientId}/start`);
    }

    async endConsultation(doctorId, patientId, data) {
        return this.post(`/doctors/${doctorId}/consultations/${patientId}/end`, data);
    }

    // Prescriptions
    async createPrescription(doctorId, data) {
        return this.post(`/doctors/${doctorId}/prescriptions`, data);
    }

    async getPrescriptions(doctorId) {
        return this.get(`/doctors/${doctorId}/prescriptions`);
    }

    // Laboratory Requests
    async createLabRequest(doctorId, data) {
        return this.post(`/doctors/${doctorId}/laboratory`, data);
    }

    async getLabRequests(doctorId) {
        return this.get(`/doctors/${doctorId}/laboratory`);
    }

    // Radiology Requests
    async createRadiologyRequest(doctorId, data) {
        return this.post(`/doctors/${doctorId}/radiology`, data);
    }

    async getRadiologyRequests(doctorId) {
        return this.get(`/doctors/${doctorId}/radiology`);
    }

    // ============================================
    // API ENDPOINTS - DEPARTMENT
    // ============================================
    
    async getDepartments() {
        return this.get('/departments');
    }

    async getDepartment(id) {
        return this.get(`/departments/${id}`);
    }

    async getDepartmentDoctors(departmentId) {
        return this.get(`/departments/${departmentId}/doctors`);
    }

    async getDepartmentServices(departmentId) {
        return this.get(`/departments/${departmentId}/services`);
    }

    // ============================================
    // API ENDPOINTS - APPOINTMENTS
    // ============================================
    
    async getAvailableSlots(doctorId, date) {
        return this.get(`/appointments/slots?doctorId=${doctorId}&date=${date}`);
    }

    async getAppointmentTypes() {
        return this.get('/appointments/types');
    }

    // ============================================
    // API ENDPOINTS - EMERGENCY
    // ============================================
    
    async requestAmbulance(data) {
        return this.post('/emergency/ambulance', data);
    }

    async getEmergencyContacts() {
        return this.get('/emergency/contacts');
    }

    async getEmergencyStatus() {
        return this.get('/emergency/status');
    }

    // ============================================
    // API ENDPOINTS - LABORATORY
    // ============================================
    
    async getLabTests() {
        return this.get('/laboratory/tests');
    }

    async getLabTest(id) {
        return this.get(`/laboratory/tests/${id}`);
    }

    async createLabTest(data) {
        return this.post('/laboratory/tests', data);
    }

    async updateLabTest(id, data) {
        return this.put(`/laboratory/tests/${id}`, data);
    }

    async uploadLabResult(testId, file) {
        return this.upload(`/laboratory/tests/${testId}/results`, file);
    }

    // ============================================
    // API ENDPOINTS - RADIOLOGY
    // ============================================
    
    async getImagingTypes() {
        return this.get('/radiology/types');
    }

    async createImagingRequest(data) {
        return this.post('/radiology/requests', data);
    }

    async getImagingRequests(patientId) {
        return this.get(`/radiology/requests?patientId=${patientId}`);
    }

    async uploadImagingResults(requestId, file) {
        return this.upload(`/radiology/requests/${requestId}/images`, file);
    }

    // ============================================
    // API ENDPOINTS - PHARMACY
    // ============================================
    
    async getMedicines(filters = {}) {
        const query = new URLSearchParams(filters).toString();
        return this.get(`/pharmacy/medicines?${query}`);
    }

    async getMedicine(id) {
        return this.get(`/pharmacy/medicines/${id}`);
    }

    async dispenseMedicine(data) {
        return this.post('/pharmacy/dispense', data);
    }

    async getInventory() {
        return this.get('/pharmacy/inventory');
    }

    // ============================================
    // API ENDPOINTS - ADMIN
    // ============================================
    
    async getDashboardStats() {
        return this.get('/admin/stats');
    }

    async getUsers(filters = {}) {
        const query = new URLSearchParams(filters).toString();
        return this.get(`/admin/users?${query}`);
    }

    async createUser(data) {
        return this.post('/admin/users', data);
    }

    async updateUser(id, data) {
        return this.put(`/admin/users/${id}`, data);
    }

    async deleteUser(id) {
        return this.delete(`/admin/users/${id}`);
    }

    async getSystemLogs(filters = {}) {
        const query = new URLSearchParams(filters).toString();
        return this.get(`/admin/logs?${query}`);
    }

    async getAnalytics(filters = {}) {
        const query = new URLSearchParams(filters).toString();
        return this.get(`/admin/analytics?${query}`);
    }

    // ============================================
    // API ENDPOINTS - SUPER ADMIN
    // ============================================
    
    async getHospitals() {
        return this.get('/super-admin/hospitals');
    }

    async createHospital(data) {
        return this.post('/super-admin/hospitals', data);
    }

    async updateHospital(id, data) {
        return this.put(`/super-admin/hospitals/${id}`, data);
    }

    async getRoles() {
        return this.get('/super-admin/roles');
    }

    async createRole(data) {
        return this.post('/super-admin/roles', data);
    }

    async updateRole(id, data) {
        return this.put(`/super-admin/roles/${id}`, data);
    }

    async getSystemHealth() {
        return this.get('/super-admin/system/health');
    }

    async backupSystem() {
        return this.post('/super-admin/system/backup');
    }

    async restoreSystem(backupId) {
        return this.post(`/super-admin/system/restore/${backupId}`);
    }

    // ============================================
    // WEBSOCKET CONNECTION (for real-time)
    // ============================================
    
    createWebSocket(endpoint) {
        const wsURL = this.baseURL.replace('http', 'ws') + endpoint;
        return new WebSocket(wsURL);
    }

    // ============================================
    // HELPER METHODS
    // ============================================
    
    createQueryString(params) {
        const searchParams = new URLSearchParams();
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
                searchParams.append(key, params[key]);
            }
        });
        return searchParams.toString();
    }

    handleError(error) {
        console.error('API Error:', error);
        return {
            success: false,
            error: error.message,
            status: error.status || 500
        };
    }

    // ============================================
    // INTERCEPTORS
    // ============================================
    
    addRequestInterceptor(interceptor) {
        this._requestInterceptor = interceptor;
    }

    addResponseInterceptor(interceptor) {
        this._responseInterceptor = interceptor;
    }

    // Override request method to include interceptors
    async request(endpoint, options = {}) {
        // Request interceptor
        if (this._requestInterceptor) {
            const modified = await this._requestInterceptor(endpoint, options);
            endpoint = modified.endpoint;
            options = modified.options;
        }

        const result = await super.request(endpoint, options);

        // Response interceptor
        if (this._responseInterceptor) {
            return await this._responseInterceptor(result);
        }

        return result;
    }
}

// ============================================
// CREATE AND EXPORT API INSTANCE
// ============================================

// Default configuration
const API_URL = window.API_URL || 'https://api.medicare.com/api';

const api = new API({
    baseURL: API_URL,
    timeout: 30000
});

// Auto-initialize with token from localStorage
const savedToken = localStorage.getItem('auth_token');
if (savedToken) {
    api.setAuthToken(savedToken);
}

// ============================================
// GLOBAL EXPOSURE
// ============================================
window.api = api;

// ============================================
// REQUEST INTERCEPTOR - Add loading indicators
// ============================================
let requestCount = 0;

api.addRequestInterceptor(async (endpoint, options) => {
    requestCount++;
    if (requestCount === 1) {
        document.body.classList.add('api-loading');
    }
    return { endpoint, options };
});

api.addResponseInterceptor(async (response) => {
    requestCount--;
    if (requestCount <= 0) {
        requestCount = 0;
        document.body.classList.remove('api-loading');
    }
    return response;
});

// ============================================
// EXPORT FOR MODULE USE
// ============================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
    module.exports.API = API;
  }
