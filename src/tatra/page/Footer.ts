import { utils } from '../utils';
import { INavConfigMenuItems } from './navConfigDef';
import { navProps } from './navProps';
export class Footer {
    public static init() {
        let footer = navProps.footer;
        if (!footer) { return; }
        footer.innerHTML = `
            <div class="ft-wrap">
                <section id="footerLinks" class="links"></section>
                <section class="ft-compliance" id="compliance"></section>
            </div>
        `;
        if ( navProps.settings.footer && navProps.settings.app.showFooterLinks || navProps.settings.app.useNavigationLinks) {
            this.render();
        }
        this.setCompliance();
    }
    private static setCompliance () {
        utils.html("compliance", this.renderCompliance(false));
    }
    public static renderCompliance(isMap : boolean) : string {
        if (! navProps.settings.subfooter) { return ''; }
        let official = (navProps.settings.app.official) ? `NASA Official: ${navProps.settings.app.official}` : '';
        let txt = `<ul>`;
        if (!isMap) {
            txt += `<li>${official}</li>`;
        }
        for (let i=0; i<navProps.settings.subfooter.items.length; i++) {
            let item = navProps.settings.subfooter.items[i];
            txt += `<li><a target="_blank" rel="noopener" class="ext" href="${item.url}">${item.label}</a></li>`;
        }
        txt += '</ul>';
        if (isMap) {
            txt = `
                <div>
                    ${txt}
                </div>
                <div class="official">
                    ${official}
                </div>
            `;
        }
        return txt;
    }

    private static subItems(items : INavConfigMenuItems) : string {
        if (! items.subMenu ) {
            return '';
        }
        let txt = '';
        for (let i=0; i<items.subMenu.length; i++) {
            let item = items.subMenu[i];
            if (!item.label || !item.url) { 
                if (item.id == 'version') {
                    let v = utils.getReleaseVersion();
                    if (v) {
                        txt += `<li><a href="javascript:void(0);">${item.label} ${v}</a></li>`;
                    }
                }
                continue; 
            }
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
        if (! navProps.settings.footer && ! navProps.settings.app.useNavigationLinks) { return;}
        let txt = `
            <section class="ft-main">
        `;
        let data = ( navProps.settings.app.useNavigationLinks ) ? navProps.settings.topMenu : navProps.settings.footer;
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