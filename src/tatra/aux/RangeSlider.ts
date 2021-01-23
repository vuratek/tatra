import { ISliderProps, Slider } from "./Slider";

export interface IRangeSliderProps extends ISliderProps {
    value2? : number;
}

export class RangeSlider {

    private props : IRangeSliderProps;
    private slider1 : Slider;
    private slider2 : Slider;

    public constructor (props : IRangeSliderProps) {
        this.props = props;
        let p1 : ISliderProps = { divId: props.divId, slide : (val) => this.slide(1, val), value : 40 };
        let p2 : ISliderProps = { divId: props.divId, slide : (val) => this.slide(2, val), step: 10, value : 70 };
        this.slider1 = new Slider (p1);
        this.slider2 = new Slider (p2);
    }

    private slide (ds: number, val : number ) {

    }
 }