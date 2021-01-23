import { props } from "../map/props";

export interface ISliderProps {
    min? : number;
    max? : number;
    value? : number;
    divId : string;
    className? : string;
    slide : (alpha: number) => void;
    step? : number;
}

export class Slider {

    private props : ISliderProps;
    private id : string;
    private div : HTMLInputElement;

    public constructor (props : ISliderProps) {
        this.props = props;
        this.id = `${props.divId}_slider`;
        let input = document.createElement("input");
        input.setAttribute("id", this.id);
        this.div = input;

        let el = document.getElementById(props.divId) as HTMLDivElement;
        if (! el) { return; }
        let className = (props.className) ? props.className : "slider";
        input.setAttribute("class", className);
        input.setAttribute("type", "range");
        this.setProperties();

        el.appendChild(input);
        input.addEventListener("input", (e) => this.onChange(e));
    }

    private setProperties () {
        if (! this.props.min) this.props.min = 0;
        if (! this.props.max) this.props.max = 100;
        if (! this.props.value) this.props.value = 50;
        if (! this.props.step) this.props.step = 1;
        this.div.setAttribute("min", this.props.min.toString());
        this.div.setAttribute("max", this.props.max.toString());
        this.div.setAttribute("value", this.props.value.toString());
        this.div.setAttribute("step", this.props.step.toString());
    }

    private onChange(evt : Event) {
        if (evt.target)
            this.props.slide(evt.target.value);
    }

    public set value (val : number) {
        if (val >= this.props.min && val <= this.props.max) {
            this.div.value = val.toString();
        }
    }
    public get value () : number {
        return Number(this.div.value);
    }
}