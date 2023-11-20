// generate r,g,b for color palette
export class colorPaletteArray {
    /** 
     * colors : ['#000000', '#ffffff', '#00ff00'] - 3 colors defining linear gradient from black to white to green
     * limit : how many divisions to make
     * returns : [0][r,g,b] ... [limit-1][r,g,b]
    */
    public static generate(colors:Array<string>, limit : number) : Array <Array <number> > {
        let res : Array < Array <number> > = [];
        for (let i=0; i<limit; i++) {
            res.push(this.getColor(colors, i, limit));
        }
        return res;
    }
    public static toRGBString (rgb : Array <number>) : string {
        return `rgb(${rgb.join(',')})`;
    }
    private static getColor(colors:Array<string>, index : number, limit : number) : Array <number> {
        if (index >= limit) {
            return [200, 200, 200];
        }
        if (limit == 1 || index == 0) {            
            return this.convertColor(colors[0]);
        } else if (index == limit - 1) {
            return this.convertColor(colors[colors.length-1]);
        } else if (limit == colors.length) {
            return this.convertColor(colors[index]);
        }
        let base = limit / (colors.length -1);
        let s = Math.floor((index) / base);
        let start = this.convertColor(colors[s]);
        let end = this.convertColor(colors[s+1]);
        let steps = [];
        for (let i=0; i<3; i++) {
            let step = Math.round((start[i] - end[i]) / base);
            steps.push(step);
        }
        let res = [];
        let p = index % base;
        for (let i=0; i<3; i++) {
            let c = Math.round(Math.abs(start[i] - (steps[i] * p)));
            if (c > 255) { c = 255;}
            if (c < 0) { c = 0;}
            res.push(c);
        }
        return res;
    }
    private static convertColor(_color : string) {
        let color = _color.replace('#','');
        let c1 = parseInt(color.substring(0,2), 16);
        let c2 = parseInt(color.substring(2,4), 16);
        let c3 = parseInt(color.substring(4,6), 16);
        return [c1, c2, c3];
    }
}