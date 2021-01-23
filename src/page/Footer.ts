import { Navigation } from './Navigation';
import { utils } from '../utils';
import { INavConfigMenuItems } from './navConfigDef';
export class Footer {
    public static init() {
        let footer = Navigation.footer;
        if (!footer) { return; }
        footer.innerHTML = `
            <div class="ft-wrap">
                <section id="footerLinks" class="links"></section>
                <section class="ft-compliance" id="compliance"></section>
            </div>
        `;
        if ( Navigation.settings.footer && Navigation.settings.app.showFooterLinks || Navigation.settings.app.useNavigationLinks) {
            this.render();
        }
        this.setCompliance();
    }
    private static setCompliance () {
        let official = (Navigation.settings.app.official) ? `<li>NASA Official: ${Navigation.settings.app.official}</li>` : '';
        let txt = `
            <ul>
                ${official}
                <li><a target="_blank" rel="noopener" class="ext" href="http://www.nasa.gov/about/highlights/HP_Privacy.html">Web Privacy Policy</a></li>
                <li><a target="_blank" rel="noopener" class="ext" href="http://science.nasa.gov/earth-science/earth-science-data/data-information-policy/">Data &amp; Information Policy</a></li>
                <li><a target="_blank" rel="noopener" class="ext" href="http://www.nasa.gov/audience/formedia/features/communication_policy.html">Communications Policy</a></li>
                <li><a target="_blank" rel="noopener" class="ext" href="http://www.nasa.gov/FOIA/index.html">Freedom of Information Act</a></li>
                <li><a target="_blank" rel="noopener" class="ext" href="http://www.usa.gov/">USA.gov</a></li>
            </ul>
        `;
        utils.html("compliance", txt);
    }

    private static subItems(items : INavConfigMenuItems) : string {
        if (! items.subMenu ) {
            return '';
        }
        let txt = '';
        for (let i=0; i<items.subMenu.length; i++) {
            let item = items.subMenu[i];
            let external = (item.external) ? 'target="_blank" rel="noopener" class="ext"' : '';
            let title = item.label.replace(/\&/g, "&amp;");
            if (item.subMenu) {
                let arr = [];
                for (let j=0; j<item.subMenu.length; j++) {
                    let sub = item.subMenu[j];
                    arr.push(`<a href="${sub.url}" title="${sub.label}">${sub.label}</a>`);
                }
                let str = arr.join(' | ');
                txt += `<li>${str}</li>`;
            } else {
                txt += `<li><a ${external}href="${item.url}" title="${title}">${title}</a></li>`;
            }
        }
        return txt;
    }

    private static render() {
        if (! Navigation.settings.footer && ! Navigation.settings.app.useNavigationLinks) { return;}
        let txt = `
            <section class="ft-main">
        `;
        let data = ( Navigation.settings.app.useNavigationLinks ) ? Navigation.settings.topMenu : Navigation.settings.footer;
        if (data) {
            for (let i=0; i < data.items.length; i++) {
                let item = data.items[i];
                if (item.id == "home") { continue; }
                let subitems = this.subItems(item);
                txt += `
                    <div class="ft-main-item">
                        <h2 class="ft-title">${item.label}</h2>
                        <ul>
                            ${subitems}
                        </ul>
                    </div>
                `;
            }
        }
        txt += `</section>`;
        utils.html('footerLinks', txt);                
    }
}