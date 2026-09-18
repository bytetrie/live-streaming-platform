import type { Styles } from "jss"
import { el, RedomComponent } from "redom"
import type { UIMetaHelper } from "./uiMetaHelper"

enum CssClass
{
	uiText = `uiText`,
	uiTextInverted = `uiTextInverted`
}

export class UIText implements UI.Styled<CssClass>, RedomComponent
{
	public id: string

	public el: HTMLSpanElement

	public classes?: Record<CssClass, string>

	constructor( private helper: UIMetaHelper, text: string, invert?: boolean )
	{
		this.id = `UIText`

		this.el = el( `span`, text )

		this.styles = this.styles.bind( this )

		this.helper.getCSSClasses( this )

		this.helper.setCss( this.el, this, invert ? CssClass.uiTextInverted : CssClass.uiText )
	}

	public update( text: string ): this
	{
		this.el.textContent = text

		return this
	}

	public styles(): Partial<Styles<CssClass>>
	{
		return {
			uiText: {
				color: data => data.textColor,
				fontSize: `0.9rem`
			},
			uiTextInverted: {
				color: data => data.textInvertedColor,
				fontSize: `0.9rem`
			}
		}
	}

	public styleVars(): Record<string, string>
	{
		return {
			textColor: `#333`,
			textInvertedColor: `#fafafa`
		}
	}
}	