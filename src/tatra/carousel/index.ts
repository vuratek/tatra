import './css/*.scss';
import { Data, Image } from "./Data";
export class Carousel {
    private currentSlide : number = 0;
    private slides : HTMLCollectionOf<Element>;
    private isRunning : boolean = false;
    private fadeClass : string = 'carousel_fade';     // class that controls fading
    private slideClass : string = 'carousel_slides';
    private parentDiv : string = '';
    private data : Data = new Data();
    private identifyClass : string;
    private showLabels : boolean = false;
    private speed : number = 5000;
    
    public constructor (parentDiv : string, slideList :  Array <Image>, speed: number, showLabels : boolean = false, slideClass : string | null = null, fadeClass : string | null = null ) {
        this.parentDiv = parentDiv;
        this.data.list = slideList;
        this.speed = speed;
        if (slideClass) {
            this.slideClass = slideClass;
        }
        if (fadeClass) {
            this.fadeClass = fadeClass;
        }
        this.showLabels = showLabels;
        this.identifyClass = `${this.parentDiv}_slide_class`;
        this.render();
        this.slides = document.getElementsByClassName(this.identifyClass);
    }

    private render() {
        let divMain = document.getElementById(this.parentDiv) as HTMLDivElement;
        if (! divMain) {
            console.error("Div doesn't exist.");
            return;
        }
        let div = document.createElement("div");
        div.setAttribute("id", `${this.parentDiv}_wrap`);
        div.setAttribute("class", "carousel");
        divMain.appendChild(div);
        
        for (let i=0; i< this.data.list.length; i++) {
            let item = this.data.list[i];
            let el = document.createElement('div');
            el.setAttribute("id", `${this.parentDiv}_slide_${i}`);
            
            el.setAttribute("class", `${this.slideClass} ${this.identifyClass}`);
            div.appendChild(el);
            el.style.backgroundImage=`url('${item.image}')`;
            el.style.backgroundRepeat = 'no-repeat';
            el.style.backgroundSize = 'cover';
            if (item.offsetY) {
                el.style.backgroundPositionY = item.offsetY;
            }
            el.style.zIndex = (i*10).toString();
            if (this.showLabels && item.label && item.label != '') {
                let el2 = document.createElement("div");
                el2.setAttribute("id", `${this.parentDiv}_slidelabel_${i}`);
                el.appendChild(el2);
                let label = '';
                if (item.label) {
                    label = item.label;
                }
                if (item.date) {
                    label += `</br><span>${item.date}</span>`;
                }
                if (item.url && item.url != '') {
                    label = `<a href="${item.url}">${label}</a>`;
                }
                el2.innerHTML = label;
            }
        }
    }

    private showSlide(slide : HTMLDivElement) {
        if (slide.className.indexOf(this.fadeClass) < 0) {
            slide.className += ` ${this.fadeClass}`;
        }
       slide.style.display = "block";  
    }

    public start() {
        this.isRunning = true;
        this.run();
    }

    public stop() {
        this.isRunning = false;
        for (let i = 0; i < this.slides.length; i++) {
            this.slides[i].className = this.slides[i].className.replace(` ${this.fadeClass}`, "");
        }
    }

    private run() {
        if (! this.isRunning) { return; }
        for (let i = 0; i < this.slides.length; i++) {
            if (i != this.currentSlide) {
                (this.slides[i] as HTMLDivElement).style.display = "none";  
            }
            (this.slides[i] as HTMLDivElement).style.zIndex = (i * 10).toString();
            this.slides[i].className = this.slides[i].className.replace(` ${this.fadeClass}`, "");
        }
        this.currentSlide++;
        if (this.currentSlide >= this.slides.length) {
            this.currentSlide = 0;
            (this.slides[0] as HTMLDivElement).style.zIndex = (this.slides.length * 10).toString();
        }    
        this.showSlide(this.slides[this.currentSlide] as HTMLDivElement);
        setTimeout(()=> this.run(), this.speed);
    }
}