/**
 * 配置表管理器 - 基于 Archero 设计模式
 * 
 * 功能：
 * 1. 加载和管理 CSV/JSON 配置表
 * 2. 提供查询接口
 * 3. 支持条件查询
 * 
 * 配置表格式（CSV）：
 * 第1行：字段说明
 * 第2行：字段类型（int, float, string, bool, int[], string[]）
 * 第3行：字段名称
 * 第4行起：数据
 */

import { _decorator, resources, JsonAsset, AssetManager } from 'cc';

/**
 * 配置表数据类型
 */
type FieldType = 'int' | 'float' | 'string' | 'bool' | 'int[]' | 'string[]' | 'json';

/**
 * 配置记录
 */
type ConfigRecord = Record<string, any>;

/**
 * 配置表管理器
 */
class ConfigManager {
    private static _instance: ConfigManager | null = null;
    
    public static get instance(): ConfigManager {
        if (!this._instance) {
            this._instance = new ConfigManager();
        }
        return this._instance;
    }

    /** 配置表缓存 { tableName: ConfigRecord[] } */
    private _configs: Map<string, ConfigRecord[]> = new Map();
    
    /** 配置表字段类型 { tableName: { fieldName: FieldType } } */
    private _fieldTypes: Map<string, Record<string, FieldType>> = new Map();

    /**
     * 加载 JSON 配置表
     * @param tableName 表名
     * @param path 资源路径
     */
    public loadJsonConfig(tableName: string, path: string): Promise<ConfigRecord[]> {
        return new Promise((resolve, reject) => {
            resources.load(path, JsonAsset, (err, jsonAsset) => {
                if (err) {
                    console.error(`[ConfigManager] 加载配置失败: ${path}`, err);
                    reject(err);
                    return;
                }
                
                const json = jsonAsset.json as ConfigRecord[];
                this._configs.set(tableName, json);
                console.log(`[ConfigManager] 加载配置成功: ${tableName} (${json.length} 条记录)`);
                resolve(json);
            });
        });
    }

    /**
     * 直接设置配置数据（用于代码定义的配置）
     * @param tableName 表名
     * @param data 配置数据
     */
    public setConfig(tableName: string, data: ConfigRecord[]): void {
        this._configs.set(tableName, data);
        console.log(`[ConfigManager] 设置配置: ${tableName} (${data.length} 条记录)`);
    }

    /**
     * 解析 CSV 格式配置
     * @param tableName 表名
     * @param csvText CSV 文本
     */
    public parseCsvConfig(tableName: string, csvText: string): ConfigRecord[] {
        const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
        
        if (lines.length < 3) {
            console.error(`[ConfigManager] CSV 格式错误: ${tableName}`);
            return [];
        }
        
        // 第1行：说明（跳过）
        // 第2行：类型
        const types = this.parseCsvLine(lines[1]);
        // 第3行：字段名
        const fields = this.parseCsvLine(lines[2]);
        
        // 保存字段类型
        const fieldTypes: Record<string, FieldType> = {};
        for (let i = 0; i < fields.length; i++) {
            fieldTypes[fields[i]] = types[i] as FieldType;
        }
        this._fieldTypes.set(tableName, fieldTypes);
        
        // 解析数据行
        const records: ConfigRecord[] = [];
        for (let i = 3; i < lines.length; i++) {
            const values = this.parseCsvLine(lines[i]);
            const record: ConfigRecord = {};
            
            for (let j = 0; j < fields.length; j++) {
                const field = fields[j];
                const type = types[j] as FieldType;
                const value = values[j] || '';
                
                record[field] = this.parseValue(value, type);
            }
            
            records.push(record);
        }
        
        this._configs.set(tableName, records);
        console.log(`[ConfigManager] 解析 CSV 配置: ${tableName} (${records.length} 条记录)`);
        
        return records;
    }

    /**
     * 解析 CSV 行
     */
    private parseCsvLine(line: string): string[] {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    }

    /**
     * 解析值
     */
    private parseValue(value: string, type: FieldType): any {
        switch (type) {
            case 'int':
                return parseInt(value) || 0;
            case 'float':
                return parseFloat(value) || 0;
            case 'string':
                return value;
            case 'bool':
                return value.toLowerCase() === 'true' || value === '1';
            case 'int[]':
                if (!value) return [];
                return value.split(',').map(v => parseInt(v.trim()) || 0);
            case 'string[]':
                if (!value) return [];
                return value.split(',').map(v => v.trim());
            case 'json':
                try {
                    return JSON.parse(value);
                } catch {
                    return {};
                }
            default:
                return value;
        }
    }

    /**
     * 根据 ID 查询配置
     * @param tableName 表名
     * @param id ID 值
     */
    public queryById(tableName: string, id: number | string): ConfigRecord | null {
        const records = this._configs.get(tableName);
        if (!records) return null;
        
        return records.find(r => r.id === id || r.ID === id) || null;
    }

    /**
     * 查询所有配置
     * @param tableName 表名
     */
    public queryAll(tableName: string): ConfigRecord[] {
        return this._configs.get(tableName) || [];
    }

    /**
     * 条件查询
     * @param tableName 表名
     * @param condition 查询条件
     */
    public queryByCondition(tableName: string, condition: Partial<ConfigRecord>): ConfigRecord[] {
        const records = this._configs.get(tableName);
        if (!records) return [];
        
        return records.filter(record => {
            for (const key in condition) {
                if (record[key] !== condition[key]) {
                    return false;
                }
            }
            return true;
        });
    }

    /**
     * 查询单条记录
     * @param tableName 表名
     * @param condition 查询条件
     */
    public queryOne(tableName: string, condition: Partial<ConfigRecord>): ConfigRecord | null {
        const records = this.queryByCondition(tableName, condition);
        return records.length > 0 ? records[0] : null;
    }

    /**
     * 范围查询
     * @param tableName 表名
     * @param field 字段名
     * @param min 最小值
     * @param max 最大值
     */
    public queryByRange(tableName: string, field: string, min: number, max: number): ConfigRecord[] {
        const records = this._configs.get(tableName);
        if (!records) return [];
        
        return records.filter(record => {
            const value = record[field];
            return value >= min && value <= max;
        });
    }

    /**
     * 检查配置是否已加载
     * @param tableName 表名
     */
    public hasConfig(tableName: string): boolean {
        return this._configs.has(tableName);
    }

    /**
     * 清空配置
     * @param tableName 表名（可选，不传则清空所有）
     */
    public clear(tableName?: string): void {
        if (tableName) {
            this._configs.delete(tableName);
            this._fieldTypes.delete(tableName);
        } else {
            this._configs.clear();
            this._fieldTypes.clear();
        }
    }
}

// 导出单例
export const configManager = ConfigManager.instance;
export { ConfigManager };
