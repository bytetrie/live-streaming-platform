import type { Styles } from "jss"
import { el, RedomComponent } from "redom"
import type { UIMetaHelper } from "./uiMetaHelper"

export interface UIButtonHandler
{
	onClick?: ( event: MouseEvent ) => void
}

enum CssClass
{
	uiButton = `uiButton`
}

export class UIButton implements UI.Styled<CssClass>, RedomComponent
{
	public id: string

	public el: HTMLButtonElement

	public classes?: Record<CssClass, string>

	constructor( private helper: UIMetaHelper, text: string, private handler?: UIButtonHandler )
	{
		this.id = `UIButton`

		this.el = el( `button`, text )

		this.helper.getCSSClasses( this )

		this.helper.setCss( this.el, this, CssClass.uiButton )

		if ( this.handler?.onClick ) this.el.addEventListener( `click`, this.handler.onClick )
	}

	public styles(): Partial<Styles<CssClass>>
	{
		return {
			uiButton: {
				background: data => data.buttonBG,
				color: data => data.buttonText,
				cursor: `pointer`,
				border: `none`,
				borderBottom: `2px solid`,
				borderBottomColor: data => data.buttonBorder,
				fontSize: `0.8rem`,
				fontWeight: `600`,
				padding: `0.25rem 1rem`,
				borderRadius: `0.2rem`,
				outline: `none`,
				transition: `background-color 200ms ease-out`,
				'&:focus': {
					outline: `none`,
				},
				'&:hover': {
					background: data => data.buttonHover
				},
				'&:active': {
					background: data => data.buttonActive
				}
			}
		}
	}

	public styleVars(): Record<string, string>
	{
		return {
			buttonBG: `#bbb`,
			buttonText: `#333`,
			buttonBorder: `#999`,
			buttonHover: `#aaa`,
			buttonActive: `#777`
		}
	}
}	