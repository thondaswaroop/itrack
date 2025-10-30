export const API_BASE_URL = "http://localhost:4000/api";
export const commonconstants = {
    APP_NAME: 'itrack',
    ITEMS_PER_PAGE: 10,
    MAX_FILE_SIZE_MB: 5,
    SUPPORTED_IMAGE_FORMATS: ["image/jpeg", "image/png", "image/gif"],
};
export enum Role {
    ADMIN = 1,
    VENDOR = 2,
    ASSOCIATE = 3,
}



// what you store in localStorage
export type UserDetails = {
    userId: number | string
    roleId: Role | `${Role}`          // allow "1" or 1
    // or for multi-role in future: roles?: Role[]
}