/**
 * Keep track of date ranges for data sets
 */

export interface IDateRange {
    min         : string;
    max         : string;
}
export interface IProductDates {
    [key : string]  : IDateRange;
}
export interface IReadInitialDates {
    [key:string] : Array<string>;
}
export class ProductDates {
    public id : string;
    public products : IProductDates = {};

    public constructor (id:string) {
        this.id = id;
    }

    public getDates ( prod : string) : IDateRange | null {
        for (let p in this.products) {
            if (prod == p) {
                return this.products[p];
            }
        }
        return null;
    }

    public setDates (prod : string, dates : IDateRange) {
        this.products[prod] = dates;
    }
}