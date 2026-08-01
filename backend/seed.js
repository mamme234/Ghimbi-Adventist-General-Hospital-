// ========== DATABASE SEEDER ==========
// Run with: node seed.js
// WARNING: This will clear existing data!

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const User = require('./models/User');
const Department = require('./models/Department');
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');
const Medicine = require('./models/Medicine');
const Appointment = require('./models/Appointment');
const Insurance = require('./models/Insurance');
const Ambulance = require('./models/Ambulance');

// ========== HOSPITAL DATA ==========
const HOSPITAL_DATA = {
    name: 'Gimbie Adventist General Hospital',
    address: 'P.O. Box 228, Gimbie Town, West Wollega Zone, Oromia Region, Ethiopia',
    phone: '+251 57 771 0083',
    email: 'gimbieadventisthosp@gmail.com',
    established: 1948,
    type: 'General Hospital',
    ownership: 'Seventh-day Adventist Church'
};

// ========== USERS DATA ==========
const USERS = [
    // ===== SUPER ADMIN =====
    {
        name: 'Michael Johnson',
        email: 'michael.johnson@gimbi.com',
        password: 'Admin@2027',
        role: 'super-admin',
        employeeId: 'SADM-000001',
        phone: '+251 91 123 4567',
        isActive: true,
        isVerified: true
    },

    // ===== ADMINISTRATORS =====
    {
        name: 'Daniel Bekele',
        email: 'daniel.bekele@gimbi.com',
        password: 'Admin@2027',
        role: 'admin',
        employeeId: 'ADM-000001',
        phone: '+251 91 123 4568',
        isActive: true,
        isVerified: true
    },
    {
        name: 'Hana Tesfaye',
        email: 'hana.tesfaye@gimbi.com',
        password: 'Admin@2027',
        role: 'admin',
        employeeId: 'ADM-000002',
        phone: '+251 91 123 4569',
        isActive: true,
        isVerified: true
    },

    // ===== DOCTORS =====
    {
        name: 'Dr. Samuel Bekele',
        email: 'samuel.bekele@gimbi.com',
        password: 'Doctor@2027',
        role: 'doctor',
        employeeId: 'DOC-000001',
        phone: '+251 91 123 4570',
        specialization: 'Cardiology',
        isActive: true,
        isVerified: true
    },
    {
        name: 'Dr. Hana Alemu',
        email: 'hana.alemu@gimbi.com',
        password: 'Doctor@2027',
        role: 'doctor',
        employeeId: 'DOC-000002',
        phone: '+251 91 123 4571',
        specialization: 'Neurology',
        isActive: true,
        isVerified: true
    },
    {
        name: 'Dr. Dawit Tadesse',
        email: 'dawit.tadesse@gimbi.com',
        password: 'Doctor@2027',
        role: 'doctor',
        employeeId: 'DOC-000003',
        phone: '+251 91 123 4572',
        specialization: 'Orthopedic Surgery',
        isActive: true,
        isVerified: true
    },
    {
        name: 'Dr. Ruth Assefa',
        email: 'ruth.assefa@gimbi.com',
        password: 'Doctor@2027',
        role: 'doctor',
        employeeId: 'DOC-000004',
        phone: '+251 91 123 4573',
        specialization: 'Obstetrics & Gynecology',
        isActive: true,
        isVerified: true
    },
    {
        name: 'Dr. Abel Girma',
        email: 'abel.girma@gimbi.com',
        password: 'Doctor@2027',
        role: 'doctor',
        employeeId: 'DOC-000005',
        phone: '+251 91 123 4574',
        specialization: 'Pediatrics',
        isActive: true,
        isVerified: true
    },
    {
        name: 'Dr. Meron Desta',
        email: 'meron.desta@gimbi.com',
        password: 'Doctor@2027',
        role: 'doctor',
        employeeId: 'DOC-000006',
        phone: '+251 91 123 4575',
        specialization: 'Internal Medicine',
        isActive: true,
        isVerified: true
    },
    {
        name: 'Dr. Yohannes Fekadu',
        email: 'yohannes.fekadu@gimbi.com',
        password: 'Doctor@2027',
        role: 'doctor',
        employeeId: 'DOC-000007',
        phone: '+251 91 123 4576',
        specialization: 'General Surgery',
        isActive: true,
        isVerified: true
    },
    {
        name: 'Dr. Bethlehem Abebe',
        email: 'bethlehem.abebe@gimbi.com',
        password: 'Doctor@2027',
        role: 'doctor',
        employeeId: 'DOC-000008',
        phone: '+251 91 123 4577',
        specialization: 'Ophthalmology',
        isActive: true,
        isVerified: true
    },

    // ===== DOCTOR ASSISTANTS =====
    {
        name: 'Selamawit Mekonnen',
        email: 'selamawit.mekonnen@gimbi.com',
        password: 'Staff@2027',
        role: 'doctor-assistant',
        employeeId: 'DA-000001',
        phone: '+251 91 123 4578',
        isActive: true,
        isVerified: true
    },
    {
        name: 'Nahom Teshome',
        email: 'nahom.teshome@gimbi.com',
        password: 'Staff@2027',
        role: 'doctor-assistant',
        employeeId: 'DA-000002',
        phone: '+251 91 123 4579',
        isActive: true,
        isVerified: true
    },
    {
        name: 'Lydia Girma',
        email: 'lydia.girma@gimbi.com',
        password: 'Staff@2027',
        role: 'doctor-assistant',
        employeeId: 'DA-000003',
        phone: '+251 91 123 4580',
        isActive: true,
        isVerified: true
    },
    {
        name: 'Elias Demissie',
        email: 'elias.demissie@gimbi.com',
        password: 'Staff@2027',
        role: 'doctor-assistant',
        employeeId: 'DA-000004',
        phone: '+251 91 123 4581',
        isActive: true,
        isVerified: true
    },

    // ===== NURSES =====
    {
        name: 'Sara Alemayehu',
        email: 'sara.alemayehu@gimbi.com',
        password: 'Nurse@2027',
        role: 'nurse',
        employeeId: 'NUR-000001',
        phone: '+251 91 123 4582',
        isActive: true,
        isVerified: true
    },
    {
        name: 'Tigist Bekele',
        email: 'tigist.bekele@gimbi.com',
        password: 'Nurse@2027',
        role: 'nurse',
        employeeId: 'NUR-000002',
        phone: '+251 91 123 4583',
        isActive: true,
        isVerified: true
    },
    {
        name: 'Martha Tesfaye',
        email: 'martha.tesfaye@gimbi.com',
        password: 'Nurse@2027',
        role: 'nurse',
        employeeId: 'NUR-000003',
        phone: '+251 91 123 4584',
        isActive: true,
        isVerified: true
    },
    {
        name: 'Ruth Desta',
        email: 'ruth.desta@gimbi.com',
        password: 'Nurse@2027',
        role: 'nurse',
        employeeId: 'NUR-000004',
        phone: '+251 91 123 4585',
        isActive: true,
        isVerified: true
    },
    {
        name: 'Kalkidan Haile',
        email: 'kalkidan.haile@gimbi.com',
        password: 'Nurse@2027',
        role: 'nurse',
        employeeId: 'NUR-000005',
        phone: '+251 91 123 4586',
        isActive: true,
        isVerified: true
    },
    {
        name: 'Betty Assefa',
        email: 'betty.assefa@gimbi.com',
        password: 'Nurse@2027',
        role: 'nurse',
        employeeId: 'NUR-000006',
        phone: '+251 91 123 4587',
        isActive: true,
        isVerified: true
    },
    {
        name: 'Helen Solomon',
        email: 'helen.solomon@gimbi.com',
        password: 'Nurse@2027',
        role: 'nurse',
        employeeId: 'NUR-000007',
        phone: '+251 91 123 4588',
        isActive: true,
        isVerified: true
    },
    {
        name: 'Hiwot Tadesse',
        email: 'hiwot.tadesse@gimbi.com',
        password: 'Nurse@2027',
        role: 'nurse',
        employeeId: 'NUR-000008',
        phone: '+251 91 123 4589',
        isActive: true,
        isVerified: true
    },

    // ===== RECEPTIONISTS =====
    {
        name: 'Rahel Fikadu',
        email: 'rahel.fikadu@gimbi.com',
        password: 'Staff@2027',
        role: 'receptionist',
        employeeId: 'REC-000001',
        phone: '+251 91 123 4590',
        isActive: true,
        isVerified: true
    },
    {
        name: 'Naomi Teshome',
        email: 'naomi.teshome@gimbi.com',
        password: 'Staff@2027',
        role: 'receptionist',
        employeeId: 'REC-000002',
        phone: '+251 91 123 4591',
        isActive: true,
        isVerified: true
    },
    {
        name: 'Eden Girma',
        email: 'eden.girma@gimbi.com',
        password: 'Staff@2027',
        role: 'receptionist',
        employeeId: 'REC-000003',
        phone: '+251 91 123 4592',
        isActive: true,
        isVerified: true
    },

    // ===== PHARMACISTS =====
    {
        name: 'Daniel Worku',
        email: 'daniel.worku@gimbi.com',
        password: 'Staff@2027',
        role: 'pharmacist',
        employeeId: 'PHA-000001',
        phone: '+251 91 123 4593',
        isActive: true,
        isVerified: true
    },
    {
        name: 'Ephrem Bekele',
        email: 'ephrem.bekele@gimbi.com',
        password: 'Staff@2027',
        role: 'pharmacist',
        employeeId: 'PHA-000002',
        phone: '+251 91 123 4594',
        isActive: true,
        isVerified: true
    },
    {
        name: 'Helen Getachew',
        email: 'helen.getachew@gimbi.com',
        password: 'Staff@2027',
        role: 'pharmacist',
        employeeId: 'PHA-000003',
        phone: '+251 91 123 4595',
        isActive: true,
        isVerified: true
    },

    // ===== LABORATORY TECHNICIANS =====
    {
        name: 'Samuel Fikre',
        email: 'samuel.fikre@gimbi.com',
        password: 'Staff@2027',
        role: 'laboratory',
        employeeId: 'LAB-000001',
        phone: '+251 91 123 4596',
        isActive: true,
        isVerified: true
    },
    {
        name: 'Elias Girma',
        email: 'elias.girma@gimbi.com',
        password: 'Staff@2027',
        role: 'laboratory',
        employeeId: 'LAB-000002',
        phone: '+251 91 123 4597',
        isActive: true,
        isVerified: true
    },
    {
        name: 'Mulugeta Bekele',
        email: 'mulugeta.bekele@gimbi.com',
        password: 'Staff@2027',
        role: 'laboratory',
        employeeId: 'LAB-000003',
        phone: '+251 91 123 4598',
        isActive: true,
        isVerified: true
    },

    // ===== RADIOLOGY STAFF =====
    {
        name: 'Dawit Mamo',
        email: 'dawit.mamo@gimbi.com',
        password: 'Staff@2027',
        role: 'radiology',
        employeeId: 'RAD-000001',
        phone: '+251 91 123 4599',
        isActive: true,
        isVerified: true
    },
    {
        name: 'Helen Tadesse',
        email: 'helen.tadesse@gimbi.com',
        password: 'Staff@2027',
        role: 'radiology',
        employeeId: 'RAD-000002',
        phone: '+251 91 123 4600',
        isActive: true,
        isVerified: true
    },

    // ===== FINANCE OFFICERS =====
    {
        name: 'Abebe Demissie',
        email: 'abebe.demissie@gimbi.com',
        password: 'Staff@2027',
        role: 'finance',
        employeeId: 'FIN-000001',
        phone: '+251 91 123 4601',
        isActive: true,
        isVerified: true
    },
    {
        name: 'Meron Kebede',
        email: 'meron.kebede@gimbi.com',
        password: 'Staff@2027',
        role: 'finance',
        employeeId: 'FIN-000002',
        phone: '+251 91 123 4602',
        isActive: true,
        isVerified: true
    },
    {
        name: 'Samuel Abate',
        email: 'samuel.abate@gimbi.com',
        password: 'Staff@2027',
        role: 'finance',
        employeeId: 'FIN-000003',
        phone: '+251 91 123 4603',
        isActive: true,
        isVerified: true
    },

    // ===== HR OFFICERS =====
    {
        name: 'Genet Bekele',
        email: 'genet.bekele@gimbi.com',
        password: 'Staff@2027',
        role: 'hr',
        employeeId: 'HR-000001',
        phone: '+251 91 123 4604',
        isActive: true,
        isVerified: true
    },
    {
        name: 'Fitsum Tadesse',
        email: 'fitsum.tadesse@gimbi.com',
        password: 'Staff@2027',
        role: 'hr',
        employeeId: 'HR-000002',
        phone: '+251 91 123 4605',
        isActive: true,
        isVerified: true
    },

    // ===== AMBULANCE DRIVERS =====
    {
        name: 'Alemayehu Girma',
        email: 'alemayehu.girma@gimbi.com',
        password: 'Staff@2027',
        role: 'ambulance',
        employeeId: 'AMB-000001',
        phone: '+251 91 123 4606',
        isActive: true,
        isVerified: true
    },
    {
        name: 'Bekele Chala',
        email: 'bekele.chala@gimbi.com',
        password: 'Staff@2027',
        role: 'ambulance',
        employeeId: 'AMB-000002',
        phone: '+251 91 123 4607',
        isActive: true,
        isVerified: true
    },

    // ===== IT OFFICERS =====
    {
        name: 'Nathan Samuel',
        email: 'nathan.samuel@gimbi.com',
        password: 'Staff@2027',
        role: 'admin',
        employeeId: 'IT-000001',
        phone: '+251 91 123 4608',
        isActive: true,
        isVerified: true
    },
    {
        name: 'Biruk Teshome',
        email: 'biruk.teshome@gimbi.com',
        password: 'Staff@2027',
        role: 'admin',
        employeeId: 'IT-000002',
        phone: '+251 91 123 4609',
        isActive: true,
        isVerified: true
    },

    // ===== ACCOUNTANTS =====
    {
        name: 'Meseret Alemu',
        email: 'meseret.alemu@gimbi.com',
        password: 'Staff@2027',
        role: 'finance',
        employeeId: 'ACC-000001',
        phone: '+251 91 123 4610',
        isActive: true,
        isVerified: true
    },
    {
        name: 'Elias Bekele',
        email: 'elias.bekele@gimbi.com',
        password: 'Staff@2027',
        role: 'finance',
        employeeId: 'ACC-000002',
        phone: '+251 91 123 4611',
        isActive: true,
        isVerified: true
    },

    // ===== CASHIERS =====
    {
        name: 'Hana Worku',
        email: 'hana.worku@gimbi.com',
        password: 'Staff@2027',
        role: 'receptionist',
        employeeId: 'CAS-000001',
        phone: '+251 91 123 4612',
        isActive: true,
        isVerified: true
    },
    {
        name: 'Bethel Tesfaye',
        email: 'bethel.tesfaye@gimbi.com',
        password: 'Staff@2027',
        role: 'receptionist',
        employeeId: 'CAS-000002',
        phone: '+251 91 123 4613',
        isActive: true,
        isVerified: true
    }
];

// ========== DEPARTMENTS DATA ==========
const DEPARTMENTS = [
    { name: 'Emergency Medicine', code: 'EM', description: '24/7 emergency care and trauma services' },
    { name: 'Internal Medicine', code: 'IM', description: 'Comprehensive adult medical care' },
    { name: 'General Surgery', code: 'GS', description: 'Surgical services for various conditions' },
    { name: 'Orthopedic Surgery', code: 'OS', description: 'Bone, joint, and muscle surgery' },
    { name: 'Obstetrics & Gynecology', code: 'OBG', description: 'Women\'s health and maternity care' },
    { name: 'Maternity & Delivery', code: 'MAT', description: 'Prenatal, delivery, and postnatal care' },
    { name: 'Pediatrics', code: 'PED', description: 'Children\'s healthcare services' },
    { name: 'Neonatal ICU', code: 'NICU', description: 'Newborn intensive care' },
    { name: 'Intensive Care Unit', code: 'ICU', description: 'Critical care for seriously ill patients' },
    { name: 'Outpatient Department', code: 'OPD', description: 'Outpatient medical services' },
    { name: 'Family Medicine', code: 'FM', description: 'Comprehensive family healthcare' },
    { name: 'Cardiology', code: 'CAR', description: 'Heart and cardiovascular care' },
    { name: 'Neurology', code: 'NEU', description: 'Brain and nervous system care' },
    { name: 'Nephrology', code: 'NEP', description: 'Kidney care and dialysis' },
    { name: 'Gastroenterology', code: 'GAS', description: 'Digestive system care' },
    { name: 'Pulmonology', code: 'PUL', description: 'Lung and respiratory care' },
    { name: 'Endocrinology', code: 'END', description: 'Hormone and metabolic disorders' },
    { name: 'Oncology', code: 'ONC', description: 'Cancer care and treatment' },
    { name: 'Dermatology', code: 'DER', description: 'Skin care and treatment' },
    { name: 'Ophthalmology', code: 'OPH', description: 'Eye care and surgery' },
    { name: 'Ear, Nose & Throat', code: 'ENT', description: 'ENT care and surgery' },
    { name: 'Dental Clinic', code: 'DEN', description: 'Dental care and surgery' },
    { name: 'Physiotherapy', code: 'PT', description: 'Physical therapy and rehabilitation' },
    { name: 'Psychiatry', code: 'PSY', description: 'Mental health care' },
    { name: 'Clinical Psychology', code: 'CP', description: 'Psychological counseling and therapy' },
    { name: 'Nutrition & Dietetics', code: 'NUT', description: 'Nutritional counseling and support' },
    { name: 'Pharmacy', code: 'PHA', description: 'Medication dispensing and counseling' },
    { name: 'Clinical Laboratory', code: 'LAB', description: 'Diagnostic laboratory services' },
    { name: 'Blood Bank', code: 'BB', description: 'Blood collection and transfusion services' },
    { name: 'Radiology & Imaging', code: 'RAD', description: 'Medical imaging services' },
    { name: 'Ultrasound Unit', code: 'US', description: 'Ultrasound diagnostic services' },
    { name: 'CT Scan Unit', code: 'CT', description: 'CT scan diagnostic services' },
    { name: 'MRI Unit', code: 'MRI', description: 'MRI diagnostic services' },
    { name: 'Operating Theatre', code: 'OT', description: 'Surgical operating rooms' },
    { name: 'Sterilization Unit', code: 'CSSD', description: 'Instrument sterilization' },
    { name: 'Dialysis Center', code: 'DIA', description: 'Dialysis treatment services' },
    { name: 'Vaccination & Immunization', code: 'VAC', description: 'Vaccination services' },
    { name: 'HIV/AIDS Care', code: 'HIV', description: 'HIV/AIDS treatment and support' },
    { name: 'TB Clinic', code: 'TB', description: 'Tuberculosis treatment' },
    { name: 'Chronic Disease Clinic', code: 'CDC', description: 'Chronic disease management' },
    { name: 'Diabetes Clinic', code: 'DIA', description: 'Diabetes care and education' },
    { name: 'Hypertension Clinic', code: 'HYP', description: 'Hypertension management' },
    { name: 'Cancer Care Center', code: 'CCC', description: 'Comprehensive cancer care' },
    { name: 'Pain Management Clinic', code: 'PMC', description: 'Pain management services' },
    { name: 'Occupational Health', code: 'OCC', description: 'Workplace health services' },
    { name: 'Infection Control', code: 'IPC', description: 'Infection prevention and control' },
    { name: 'Ambulance Services', code: 'AMB', description: 'Emergency transport services' },
    { name: 'Home Health Care', code: 'HHC', description: 'Home-based healthcare services' },
    { name: 'Telemedicine', code: 'TEL', description: 'Remote healthcare consultations' },
    { name: 'Medical Records', code: 'EMR', description: 'Electronic medical records' },
    { name: 'Health Information', code: 'HIM', description: 'Health information management' },
    { name: 'Patient Registration', code: 'REG', description: 'Patient registration services' },
    { name: 'Billing & Cashier', code: 'BIL', description: 'Billing and payment services' },
    { name: 'Insurance Office', code: 'INS', description: 'Insurance processing services' },
    { name: 'Social Services', code: 'SOC', description: 'Social work and support services' },
    { name: 'Mortuary', code: 'MOR', description: 'Mortuary services' },
    { name: 'Biomedical Engineering', code: 'BME', description: 'Medical equipment maintenance' },
    { name: 'Quality Assurance', code: 'QA', description: 'Quality and safety management' },
    { name: 'Research & Education', code: 'RES', description: 'Research and medical education' }
];

// ========== MEDICINES DATA ==========
const MEDICINES = [
    {
        name: 'Amoxicillin',
        brand: 'Amoxil',
        genericName: 'Amoxicillin',
        category: 'antibiotic',
        form: 'capsule',
        strength: '500mg',
        unit: 'mg',
        price: { purchasePrice: 30, sellingPrice: 45 },
        stock: { quantity: 150, minStock: 50, reorderPoint: 30 },
        prescriptionRequired: true,
        isActive: true
    },
    {
        name: 'Ibuprofen',
        brand: 'Advil',
        genericName: 'Ibuprofen',
        category: 'analgesic',
        form: 'tablet',
        strength: '200mg',
        unit: 'mg',
        price: { purchasePrice: 20, sellingPrice: 35 },
        stock: { quantity: 200, minStock: 60, reorderPoint: 40 },
        prescriptionRequired: false,
        isActive: true
    },
    {
        name: 'Metformin',
        brand: 'Glucophage',
        genericName: 'Metformin',
        category: 'antidiabetic',
        form: 'tablet',
        strength: '500mg',
        unit: 'mg',
        price: { purchasePrice: 40, sellingPrice: 60 },
        stock: { quantity: 100, minStock: 40, reorderPoint: 25 },
        prescriptionRequired: true,
        isActive: true
    },
    {
        name: 'Lisinopril',
        brand: 'Zestril',
        genericName: 'Lisinopril',
        category: 'antihypertensive',
        form: 'tablet',
        strength: '10mg',
        unit: 'mg',
        price: { purchasePrice: 35, sellingPrice: 55 },
        stock: { quantity: 80, minStock: 30, reorderPoint: 20 },
        prescriptionRequired: true,
        isActive: true
    },
    {
        name: 'Cetirizine',
        brand: 'Zyrtec',
        genericName: 'Cetirizine',
        category: 'antihistamine',
        form: 'tablet',
        strength: '10mg',
        unit: 'mg',
        price: { purchasePrice: 15, sellingPrice: 25 },
        stock: { quantity: 120, minStock: 40, reorderPoint: 25 },
        prescriptionRequired: false,
        isActive: true
    },
    {
        name: 'Vitamin C',
        brand: 'Nature\'s Way',
        genericName: 'Ascorbic Acid',
        category: 'vitamin',
        form: 'tablet',
        strength: '1000mg',
        unit: 'mg',
        price: { purchasePrice: 25, sellingPrice: 35 },
        stock: { quantity: 180, minStock: 50, reorderPoint: 30 },
        prescriptionRequired: false,
        isActive: true
    },
    {
        name: 'Paracetamol',
        brand: 'Panadol',
        genericName: 'Acetaminophen',
        category: 'analgesic',
        form: 'tablet',
        strength: '500mg',
        unit: 'mg',
        price: { purchasePrice: 10, sellingPrice: 20 },
        stock: { quantity: 300, minStock: 100, reorderPoint: 50 },
        prescriptionRequired: false,
        isActive: true
    },
    {
        name: 'Omeprazole',
        brand: 'Prilosec',
        genericName: 'Omeprazole',
        category: 'gastrointestinal',
        form: 'capsule',
        strength: '20mg',
        unit: 'mg',
        price: { purchasePrice: 30, sellingPrice: 50 },
        stock: { quantity: 90, minStock: 30, reorderPoint: 20 },
        prescriptionRequired: true,
        isActive: true
    }
];

// ========== AMBULANCE DATA ==========
const AMBULANCES = [
    {
        ambulanceId: 'AMB-001',
        vehicleNumber: 'A-001',
        type: 'advanced',
        model: 'Mercedes Sprinter',
        year: 2023,
        licensePlate: 'AA-1234',
        status: 'available',
        driver: {
            name: 'Alemayehu Girma',
            licenseNumber: 'DL-001',
            phone: '+251 91 123 4606',
            status: 'available'
        },
        equipment: [
            { name: 'Stretcher', quantity: 1, status: 'functional' },
            { name: 'Oxygen Tank', quantity: 2, status: 'functional' },
            { name: 'Defibrillator', quantity: 1, status: 'functional' }
        ],
        fuelLevel: 85,
        mileage: 45000
    },
    {
        ambulanceId: 'AMB-002',
        vehicleNumber: 'A-002',
        type: 'basic',
        model: 'Toyota Hiace',
        year: 2022,
        licensePlate: 'AA-5678',
        status: 'available',
        driver: {
            name: 'Bekele Chala',
            licenseNumber: 'DL-002',
            phone: '+251 91 123 4607',
            status: 'available'
        },
        equipment: [
            { name: 'Stretcher', quantity: 1, status: 'functional' },
            { name: 'Oxygen Tank', quantity: 1, status: 'functional' }
        ],
        fuelLevel: 70,
        mileage: 35000
    }
];

// ========== INSURANCE DATA ==========
const INSURANCES = [
    {
        provider: 'Ethio-Insurance',
        coverageType: 'group',
        coverageDetails: {
            inpatientCoverage: 80,
            outpatientCoverage: 70,
            prescriptionCoverage: 60,
            emergencyCoverage: 90,
            annualLimit: 200000,
            deductible: 1000,
            copay: 20
        },
        status: 'active'
    },
    {
        provider: 'Awash Insurance',
        coverageType: 'individual',
        coverageDetails: {
            inpatientCoverage: 75,
            outpatientCoverage: 65,
            prescriptionCoverage: 50,
            emergencyCoverage: 85,
            annualLimit: 150000,
            deductible: 1500,
            copay: 25
        },
        status: 'active'
    }
];

// ========== SAMPLE PATIENTS ==========
const PATIENTS = [
    {
        patientId: 'PAT-001',
        name: 'Abebe Kebede',
        email: 'abebe.kebede@email.com',
        phone: '+251 91 123 4700',
        dateOfBirth: new Date('1980-05-15'),
        gender: 'male',
        bloodGroup: 'O+',
        address: {
            street: 'Gimbie Town',
            city: 'Gimbie',
            state: 'Oromia',
            country: 'Ethiopia'
        },
        status: 'active'
    },
    {
        patientId: 'PAT-002',
        name: 'Helen Girma',
        email: 'helen.girma@email.com',
        phone: '+251 91 123 4701',
        dateOfBirth: new Date('1990-10-20'),
        gender: 'female',
        bloodGroup: 'A+',
        address: {
            street: 'Gimbie Town',
            city: 'Gimbie',
            state: 'Oromia',
            country: 'Ethiopia'
        },
        status: 'active'
    },
    {
        patientId: 'PAT-003',
        name: 'Tewodros Hailu',
        email: 'tewodros.hailu@email.com',
        phone: '+251 91 123 4702',
        dateOfBirth: new Date('1975-03-10'),
        gender: 'male',
        bloodGroup: 'B+',
        address: {
            street: 'Gimbie Town',
            city: 'Gimbie',
            state: 'Oromia',
            country: 'Ethiopia'
        },
        status: 'active'
    }
];

// ========== SEED FUNCTION ==========
async function seedDatabase() {
    try {
        console.log('🌱 Starting database seeding...');
        console.log('='.repeat(60));

        // Connect to MongoDB
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gimbi-hospital';
        await mongoose.connect(mongoURI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        console.log('🗑️ Clearing existing data...');
        await User.deleteMany({});
        await Department.deleteMany({});
        await Doctor.deleteMany({});
        await Patient.deleteMany({});
        await Medicine.deleteMany({});
        await Appointment.deleteMany({});
        await Insurance.deleteMany({});
        await Ambulance.deleteMany({});

        // ===== SEED DEPARTMENTS =====
        console.log('📋 Seeding departments...');
        const departmentDocs = await Department.insertMany(DEPARTMENTS);
        console.log(`✅ ${departmentDocs.length} departments seeded`);

        // ===== SEED USERS =====
        console.log('👤 Seeding users...');
        const userDocs = [];
        for (const userData of USERS) {
            const hashedPassword = await bcrypt.hash(userData.password, 12);
            const user = new User({
                ...userData,
                password: hashedPassword
            });
            await user.save();
            userDocs.push(user);
        }
        console.log(`✅ ${userDocs.length} users seeded`);

        // ===== SEED DOCTORS =====
        console.log('👨‍⚕️ Seeding doctors...');
        const doctorUsers = userDocs.filter(u => u.role === 'doctor');
        const doctorDocs = [];
        for (const user of doctorUsers) {
            const doctor = new Doctor({
                userId: user._id,
                name: user.name,
                specialization: user.specialization || 'General Medicine',
                department: departmentDocs[0]._id,
                licenseNumber: `LIC-${user.employeeId}`,
                yearsOfExperience: Math.floor(Math.random() * 20) + 5,
                isAvailable: true
            });
            await doctor.save();
            doctorDocs.push(doctor);
        }
        console.log(`✅ ${doctorDocs.length} doctors seeded`);

        // ===== SEED PATIENTS =====
        console.log('🏥 Seeding patients...');
        const patientDocs = await Patient.insertMany(PATIENTS);
        console.log(`✅ ${patientDocs.length} patients seeded`);

        // ===== SEED MEDICINES =====
        console.log('💊 Seeding medicines...');
        const medicineDocs = await Medicine.insertMany(MEDICINES);
        console.log(`✅ ${medicineDocs.length} medicines seeded`);

        // ===== SEED INSURANCE =====
        console.log('🛡️ Seeding insurance...');
        const insuranceDocs = await Insurance.insertMany(INSURANCES);
        console.log(`✅ ${insuranceDocs.length} insurance providers seeded`);

        // ===== SEED AMBULANCES =====
        console.log('🚑 Seeding ambulances...');
        const ambulanceDocs = await Ambulance.insertMany(AMBULANCES);
        console.log(`✅ ${ambulanceDocs.length} ambulances seeded`);

        // ===== SEED APPOINTMENTS =====
        console.log('📅 Seeding appointments...');
        const appointments = [];
        const today = new Date();
        for (let i = 0; i < 10; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i + 1);
            const appointment = new Appointment({
                appointmentId: `APT-${Date.now()}-${i}`,
                patientId: patientDocs[i % patientDocs.length]._id,
                doctorId: doctorDocs[i % doctorDocs.length]._id,
                departmentId: departmentDocs[i % departmentDocs.length]._id,
                date: date,
                time: `${9 + (i % 8)}:00`,
                status: ['pending', 'confirmed', 'completed'][i % 3],
                reason: 'Routine checkup'
            });
            appointments.push(appointment);
        }
        await Appointment.insertMany(appointments);
        console.log(`✅ ${appointments.length} appointments seeded`);

        // ===== DISPLAY SUMMARY =====
        console.log('='.repeat(60));
        console.log('🎉 Database seeding completed successfully!');
        console.log('='.repeat(60));
        console.log('📊 Summary:');
        console.log(`  • ${userDocs.length} users`);
        console.log(`  • ${departmentDocs.length} departments`);
        console.log(`  • ${doctorDocs.length} doctors`);
        console.log(`  • ${patientDocs.length} patients`);
        console.log(`  • ${medicineDocs.length} medicines`);
        console.log(`  • ${insuranceDocs.length} insurance providers`);
        console.log(`  • ${ambulanceDocs.length} ambulances`);
        console.log(`  • ${appointments.length} appointments`);
        console.log('='.repeat(60));
        console.log('🔑 Login Credentials:');
        console.log('  Super Admin: michael.johnson@gimbi.com / Admin@2027');
        console.log('  Admin: daniel.bekele@gimbi.com / Admin@2027');
        console.log('  Doctor: samuel.bekele@gimbi.com / Doctor@2027');
        console.log('  Nurse: sara.alemayehu@gimbi.com / Nurse@2027');
        console.log('  Pharmacist: daniel.worku@gimbi.com / Staff@2027');
        console.log('  Receptionist: rahel.fikadu@gimbi.com / Staff@2027');
        console.log('='.repeat(60));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

// Run seeder
seedDatabase();
