import multer from 'multer';

const storage = multer.memoryStorage();

const fileUpload = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
    },
});

export default fileUpload;
