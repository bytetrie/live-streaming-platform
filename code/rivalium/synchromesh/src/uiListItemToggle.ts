import type { Styles } from "jss"
import { el, mount, RedomComponent } from "redom"
import type { UIMetaHelper } from "./uiMetaHelper"
import type { UISwitchGroup } from "./uiSwitchGroup"
import { UIText } from "./uiText"

enum CssClass
{
	uiListItemToggle = `uiListItemToggle`,
	uiListItemToggleLabel = `uiListItemToggleLabel`,
}

export interface UIListItemToggleData
{
	label: string
	toggle?: UISwitchGroup
}

export class UIListItemToggle implements UI.Styled<CssClass>, RedomComponent
{
	public id: string

	public el: HTMLElement

	public classes?: Record<CssClass, string>

	private label?: UIText

	private toggle?: UISwitchGroup

	private helper?: UIMetaHelper

	constructor()
	{
		this.id = `UIListItemToggle`

		this.el = el( `li` )

		this.styles = this.styles.bind( this )
	}

	public update( 
		{ label, toggle }: UIListItemToggleData, 
		_: number, 
		__: UIListItemToggleData[], 
		{ helper }: {helper: UIMetaHelper} ): this
	{
		let setCss = false

		if ( !this.helper ) 
		{
			this.helper = helper

			setCss = true
		}

		if( !this.label )
		{
			this.label = new UIText( this.helper, label )

			mount( this.el, this.label )
		}

		this.label.update( label ) 

		if ( toggle )
		{
			this.toggle = toggle

			mount( this.el, this.toggle )
		}

		if ( setCss ) 
		{
			this.helper.getCSSClasses( this )

			this.helper.setCss( this.el, this, CssClass.uiListItemToggle )

			this.helper.setCss( this.label.el, this, CssClass.uiListItemToggleLabel )
		}

		return this
	}

	public styles(): Partial<Styles<CssClass>>
	{
		return {
			uiListItemToggle: {
				listStyle: `none`,
				display: `block`
			},
			uiListItemToggleLabel: {
				display: `block`,
				fontWeight: `700`,
				fontSize: `0.8rem`,
				marginBottom: `0.4rem`
			}
		}
	}

	public styleVars(): Record<string, string>
	{
		return {}
	}
}