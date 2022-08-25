import { Navigation } from './Navigation';
export class Header {
    
    public static init() {
        let header = Navigation.header;
        if (! header) { return; }
//        <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"> 
        let label = '';
        
        let urlHome = (Navigation.settings.app.alternateHome) ? Navigation.settings.app.alternateHome : '/';        
        
        header.innerHTML = `
            <div id="earthdata-notification-banner"></div>
            <div class="header-wrap">
                <div id="headerTitle" class="topMenu-logo">
                    <a href="${urlHome}">
                        ${this.renderLogo('header')}
                    </a>
                    <a href="${urlHome}">
                        ${this.renderLabel('header')}   
                    </a>             
                </div>		
				<div id="cart" class="cart"></div>                 
            </div>
            <nav id="navBar" class="topNavBar"></nav>	   
            <div id="topMenuContentWrap"></div>
        `;
    }

    public static getLabelLogo(divIdBase : string) : string {
        return `
            ${this.renderLogo(divIdBase)}
            ${this.renderLabel(divIdBase)}   
        `;
    }

    private static renderLogo(divIdBase : string) : string {
        let second = (Navigation.settings.app.mainIcon2) ? `<img id="${divIdBase}Logo2" alt="Logo2">` : '';
        return `
            <div class="logoWrapper">
                <img id="${divIdBase}Logo" alt="Logo">
                ${second}
            </div>
        `;
    }

    private static renderLabel(divIdBase : string) : string {
        let beta = '';
        if (Navigation.settings.app.isBeta === true) {
            beta = ' <span class="isBETA">BETA</span>';
        }
        if (Navigation.settings.app.doubleShortLabel && Navigation.settings.app.doubleLongLabel) {
            return `
                <div id="${divIdBase}TxtLabel" class="headerTxtLabel">
                    <span id="${divIdBase}LabelShort" class="headerLabel headerLabelShort font">${Navigation.settings.app.doubleShortLabel}${beta}</span><br/>
                    <span class="headerLabel font">${Navigation.settings.app.doubleLongLabel}</span>
                </div>
                <div id="${divIdBase}TxtLabelSmall" class="headerTxtLabel font">${Navigation.settings.app.doubleShortLabel}${beta}</div>
            `;
        } else {
            let short = ( Navigation.settings.app.singleShortLabel ) ? Navigation.settings.app.singleShortLabel : Navigation.settings.app.singleLabel;
            return `
                <div id="${divIdBase}TxtLabel" class="headerTxtLabel isSingle">
                    <span id="${divIdBase}LabelShort" class="headerLabel font headerLabelShort isSingle">${Navigation.settings.app.singleLabel}${beta}</span>
                </div>
                <div id="${divIdBase}TxtLabelSmall" class="headerTxtLabel font">${short}</div>
            `;
        }
    }

    public static setLogo (divIdBase : string) {
        let url = Navigation.settings.app.mainIcon;
        let logo = document.getElementById(`${divIdBase}Logo`) as HTMLImageElement;
        if (logo) {
            logo.src = url;
        }
        if (Navigation.settings.app.mainIcon2) {
            logo = document.getElementById(`${divIdBase}Logo2`) as HTMLImageElement;
            url = Navigation.settings.app.mainIcon2;
            if (logo) {
                logo.src = url;
            }
        }
    }
}