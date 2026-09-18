import type { Styles } from "jss"
import type { RedomComponent } from "redom"
import type { UIMetaHelper } from "./uiMetaHelper"
import { UIText } from "./uiText"

enum CssClass
{
	uiLoadingMessage = `uiLoadingMessage`,
	uiLoadingAnimation = `@keyframes loading`
}

export class UILoadingMessage implements UI.Styled<CssClass>, RedomComponent
{
	public id: string

	public el: HTMLElement

	public classes?: Record<CssClass, string>

	constructor( private helper: UIMetaHelper, text = `Loading` )
	{
		this.id = `UILoadingMessage`

		this.el = ( new UIText( this.helper, text ) ).el

		this.styles = this.styles.bind( this )

		this.helper.getCSSClasses( this )

		this.helper.setCss( this.el, this, CssClass.uiLoadingMessage )
	}

	public styles(): Partial<Styles<CssClass>>
	{
		return {
			uiLoadingMessage: {
				display: `flex`,
				alignItems: `center`,
				position: `relative`,
				'&:before': {
					content: `''`,
					display: `inline-block`,
					marginRight: `0.2rem`,
					borderRadius: `50%`,
					border: `2px solid`,
					borderColor: data => data.loader,
					width: `1em`,
					height: `1em`
				},
				'&:after': {
					content: `''`,
					display: `inline-block`,
					marginRight: `0.2rem`,
					borderRadius: `50%`,
					borderRight: `4px solid`,
					borderColor: data => data.loader,
					width: `1em`,
					height: `1em`,
					position: `absolute`,
					top: `2px`,
					left: `0`,
					animation: `$loading 400ms infinite linear`
				}
			},
			[ CssClass.uiLoadingAnimation ]: {
				from: `transform: rotate(0deg)`,
				to: `transform: rotate(364deg)`
			},
		}
	}

	public styleVars(): Record<string, string>
	{
		return {
			loader: `#999`
		}
	}
}