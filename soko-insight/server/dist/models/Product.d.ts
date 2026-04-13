export interface Product {
    id: string;
    userId: string;
    categoryId: string | null;
    name: string;
    sku: string | null;
    description: string | null;
    costPrice: number;
    sellingPrice: number;
    currentStock: number;
    reorderLevel: number;
    unit: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateProductInput {
    userId: string;
    categoryId?: string;
    name: string;
    sku?: string;
    description?: string;
    costPrice?: number;
    sellingPrice: number;
    currentStock?: number;
    reorderLevel?: number;
    unit?: string;
}
export interface UpdateProductInput {
    categoryId?: string;
    name?: string;
    sku?: string;
    description?: string;
    costPrice?: number;
    sellingPrice?: number;
    currentStock?: number;
    reorderLevel?: number;
    unit?: string;
    isActive?: boolean;
}
export declare class ProductModel {
    static findById(id: string, userId?: string): Promise<Product | null>;
    static findByUserId(userId: string, options?: {
        page?: number;
        limit?: number;
        search?: string;
        categoryId?: string;
        isActive?: boolean;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<{
        products: Product[];
        total: number;
    }>;
    static create(input: CreateProductInput): Promise<Product>;
    static update(id: string, userId: string, input: UpdateProductInput): Promise<Product | null>;
    static delete(id: string, userId: string): Promise<boolean>;
    static updateStock(id: string, quantity: number, operation: 'add' | 'subtract' | 'set'): Promise<Product | null>;
    static getLowStock(userId: string): Promise<Product[]>;
    static countByUser(userId: string): Promise<number>;
}
//# sourceMappingURL=Product.d.ts.map