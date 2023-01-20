// base class for menu module
import { IMenuModule } from '../../defs/ConfigDef';
import { GroupContent } from '../../../aux/GroupContent';

export class Module {
    public props : IMenuModule;
    public _isActive : boolean = false;
    public _hasGroup : boolean = true;  // whether it is closeable

    public constructor(props : IMenuModule) {
        this.props = props;
        if (! props.opened) {
            props.opened = false;
        }
        if (props.hasGroup) {
            this._hasGroup = props.hasGroup;
        } else {
            this._hasGroup = true;
        }
    }

    // create initial div component; customization done in a child class
    public render(div:HTMLDivElement) {
        if (this._hasGroup) {
            GroupContent.create( {id : this.props.id, label : this.props.label, parent: div, opened : this.props.opened} );
        } else {
            let el = document.createElement("div");
            el.id = `mmm_${this.props.id}`;
            div.appendChild(el);
            el.innerHTML = `<div style="color:white;background:black;">${this.props.label}</div>`;
        }
        this.activate();
    }

    public isActive() : boolean {
		return this._isActive;
	}

    // do something when module becomes active
    public activate() {
        this._isActive = true;
    }

    public hasGroup() : boolean {
        return this._hasGroup;
    }

    // when module is removed from the map menu
    public deactivate() {
        this._isActive = false;
    }

}
