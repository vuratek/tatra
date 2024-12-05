import { props } from "./props";

export interface IImageObj {
    image           : HTMLCanvasElement | null;
    context         : CanvasRenderingContext2D | null;
}
export class imageUtils {

    // used by screenshot and animation
    public static renderScreenshot() : IImageObj | null {
        let canvases = document.querySelectorAll('.ol-layer canvas, canvas.ol-layer');
//        let canvases = document.querySelectorAll('.ol-layer canvas');
        if (canvases.length == 0) {
            console.log("Error obtaining map canvas");
            return null;
        }

        let image = document.createElement('canvas');
        let size = props.map.getSize();
        if (size == undefined) { return null; }
        image.width = size[0];
        image.height = size[1];
        let context = image.getContext('2d');
        for (let i=0; i<canvases.length; i++) {
            let canvas = canvases[i] as HTMLCanvasElement;
            if (canvas.width > 0 && context) {
                let opacity = (canvas.parentNode as HTMLElement).style.opacity || canvas.style.opacity;
                context.globalAlpha = opacity === '' ? 1 : Number(opacity);
                let transform = canvas.style.transform;
                let matrix;

                // Get the transform parameters from the style's transform matrix
                if (transform) {
                    matrix = transform
                    .match(/^matrix\(([^\(]*)\)$/)[1]
                    .split(',')
                    .map(Number);
                } else {
                    matrix = [
                        parseFloat(canvas.style.width) / canvas.width,
                        0,
                        0,
                        parseFloat(canvas.style.height) / canvas.height,
                        0,
                        0,
                      ];
                }
                    
                // Apply the transform to the export map context
                CanvasRenderingContext2D.prototype.setTransform.apply(context, matrix);
                context.drawImage(canvas, 0, 0);
            }
        }
        if (context) {
            context.setTransform(1, 0, 0, 1, 0, 0);
        }
        let obj:IImageObj = {image : image, context : context};
        return obj;
    }
}