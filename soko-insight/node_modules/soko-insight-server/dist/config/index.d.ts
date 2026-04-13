export declare const config: {
    nodeEnv: string;
    port: number;
    database: {
        url: string;
        host: string;
        port: number;
        name: string;
        user: string;
        password: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
    upload: {
        maxFileSize: number;
        uploadDir: string;
    };
    email: {
        host: string;
        port: number;
        user: string;
        pass: string;
    };
    africastalking: {
        apiKey: string;
        username: string;
        senderId: string;
    };
    clientUrl: string;
    mlService: {
        url: string;
    };
};
export declare function validateConfig(): void;
export default config;
//# sourceMappingURL=index.d.ts.map