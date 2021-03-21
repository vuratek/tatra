import { INavConfigMenuItems, INavConfigMenu } from "../page/navConfigDef";
import { Navigation } from "../page/Navigation";
import { SideMenuItem } from "./SideMenuItem";

export class SideMenuCommon {

    public static getDataSource (isLeft : boolean) : INavConfigMenu {
        return (isLeft) ? Navigation.settings.sideMenu : Navigation.settings.topMenu;
    }

    public static getSideMenuItemById (id: string, isLeft:boolean) : INavConfigMenuItems | null {
        let data = this.getDataSource(isLeft);
        for (let i =0 ; i < data.items.length; i++) {
            let element = data.items[i];
            if (element.id == id) {
                return element;
            }
            if (element.subMenu) {
                for (let j=0; j < element.subMenu.length; j ++) {
                    let subElement = element.subMenu[j];
                    if (subElement.id == id) {
                        return subElement;
                    }
                }
            }
        }
        return null;
    }

    public static update (isLeft:boolean) {
        let data = this.getDataSource(isLeft);
        for (let i =0 ; i< data.items.length; i++) {
            let element = data.items[i];
            if (element.subMenu) {
                SideMenuItem.update(element, false, element.collapsed as boolean, isLeft);
                for (let j=0; j < element.subMenu.length; j ++) {
                    let subElement = element.subMenu[j];
                    SideMenuItem.update(subElement, true, element.collapsed as boolean, isLeft);
                }
            }
        }
    }

    public static initialize( isLeft : boolean) {
        let data = this.getDataSource(isLeft);
        for (let i =0 ; i< data.items.length; i++) {
            let url = window.location.pathname;
            let element : INavConfigMenuItems = data.items[i];
            element.collapsed = true;
            if (element.subMenu) {                
                for (let j = 0; j < element.subMenu.length; j ++) {
                    if (element.subMenu[j].url == url ) {
                        element.subMenu[j].active = true;
                        element.collapsed = false;
                        break;
                    }
                }
                if (element.isOpened) {
                    element.collapsed = false;
                }
            } else {
                if (element.url == url ) {
                    element.active = true;
                }
            }
        }
    }
}