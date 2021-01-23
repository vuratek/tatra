import { BaseTool } from "./BaseTool";

export class World extends BaseTool  {

    public populateResults (divResults : HTMLDivElement) {
        divResults.innerHTML = `<div class="windowRR">Whole world [-180. -90, 180, 90]</div>`;
    }
}
