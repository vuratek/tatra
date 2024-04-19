export interface navConfigDef {
    app             : INavConfigApp;    // application settings
    topMenu         : INavConfigMenu;   // top navigation menu
    sideMenu        : INavConfigMenu;   // left side menu
    footer?         : INavConfigMenu;   // footer is optional; if not defined only the minimal standard footer is shown (NASA official, main NASA links)
    subfooter?      : INavConfigMenu;   // subfooter is optional; if not defined only the minimal standard footer is shown (NASA official, main NASA links)
}

export enum NavigationModes {
    BASIC   = "basic",
    RICH    = "rich",
}

export interface INavConfigApp {
    mainIcon            : string;       // icon used in left side menu and top banner
    mainIcon2?          : string;       // optional second icon used with mainIcon (two logos like NASA and USFS)
    screenShotIcon      : string;       // used for screenshot. If not defined, it uses mainIcon
    search?             : string;
    useMap?             : boolean;      // if true, (default false) the application is treated as map (no page scrolling, small header and footer)
    menuLabel?          : string;       // label used in left menu header
    doubleShortLabel?   : string;       // top line in double line header
    doubleLongLabel?    : string;       // bottom line in double line header
    singleLabel?        : string;       // single line header
    singleShortLabel?   : string;       // single line header when resolution is small
    official?           : string;       // NASA official
    timelineURL?        : string;       // url link to timeline javascript library
    alternateHome?      : string;
    feedbackHeader?     : string;       // if tophat feedback is used, this the Subject header in the feedback form
    mobileMenu?         : boolean;      // create mobile version of top navigation
    useNavigationLinks? : boolean;      // if set, footer is a replica of top navigation links except HOME
    navigationMode      : string;
    showFooterLinks?    : boolean;      // generate footer with links
    isBeta?             : boolean;      // if beta, BETA tag will be shown in the header
}

export interface INavConfigMenu {
    div         : string;
    minWidth?   : number;               // min width before side menu doesn't show bar by default
    items       : Array <INavConfigMenuItems>;  // items in the menu
}

export interface INavConfigMenuItems {
    id          : string;               // id so it can be reference by user's code
    label       : string;               // label as shown in the menu
    url?        : string;               
    title?      : string;               // title for a href; if not defined, label is used
    color?      : string;               // icon can have optional color
    subMenu?    : Array <INavConfigMenuItems>;
    type?       : string;
    isOpened?   : boolean;
    icon?       : string;               // fontAwesome icon label
    active?     : boolean;              // internal; whether the item us active (browser url matches the item's url)
    collapsed?  : boolean;              // if the item contains submenu, is the menu expended / collapsed
    external?   : boolean;              // is url in the menu treated as external link (extra icon and opens a new tab)
    internal?   : boolean;
}