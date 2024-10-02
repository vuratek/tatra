import { INavConfigMenuItems, INavConfigMenu } from "../page/navConfigDef";
import { SideMenuItem } from "./SideMenuItem";
import { navProps } from "../page/navProps";

export class SideMenuCommon {

    public static getDataSource (isLeft : boolean) : INavConfigMenu {
        return (isLeft) ? navProps.settings.sideMenu : navProps.settings.topMenu;
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
                    if (subElement.subMenu) {
                        SideMenuItem.update(subElement, false, subElement.collapsed as boolean, isLeft);
                        for (let k=0; k < subElement.subMenu.length; k++) {
                            let subElement2 = subElement.subMenu[k];
                            SideMenuItem.update(subElement2, true, subElement.collapsed as boolean, isLeft);
                        }
                    }
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
                    let subElement = element.subMenu[j];
                    if (subElement.url == url ) {
                        subElement.active = true;
                        element.collapsed = false;
                        break;
                    }
                    subElement.collapsed = true;
                    if (subElement.subMenu) {
                        for (let k=0; k < subElement.subMenu.length; k++) {
                            let subElement2 = subElement.subMenu[k];
                            if (subElement2.url == url ) {
                                subElement2.active = true;
                                subElement.collapsed = false;
                                break;
                            }
                        }
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