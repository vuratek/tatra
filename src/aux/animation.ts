export class animation {
    private static prefixes = ["webkit", "moz", "MS", "o"];

    public static init () {
        let elem = document.createElement('div');

        // Animation Start
        (window as Window)["animationStart"] = "animationstart";
        for (var i = 0; i < this.prefixes.length; i++) {
            if (elem.style[this.prefixes[i] + "AnimationStart"] !== undefined){
                (window as Window)["animationStart"] = this.prefixes[i] + "AnimationStart";
                break;
            }
        }

        // Animation Iteration
        (window as Window)["animationIteration"] = "animationiteration";
        for (var i = 0; i < this.prefixes.length; i++) {
            if (elem.style[this.prefixes[i] + "AnimationIteration"] !== undefined){
                (window as Window)["animationIteration"] = this.prefixes[i] + "AnimationIteration";
                break;
            }
        }

        // Animation End
        (window as Window)["animationEnd"] = "animationend";
        for (var i = 0; i < this.prefixes.length; i++) {
            if (elem.style[this.prefixes[i] + "AnimationEnd"] !== undefined){
                (window as Window)["animationEnd"] = this.prefixes[i] + "AnimationEnd";
                break;
            }
        }
    }
}