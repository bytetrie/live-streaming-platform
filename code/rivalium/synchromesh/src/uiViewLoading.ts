import type { Styles } from "jss"
import { el, RedomComponent } from "redom"
import { UILoadingMessage } from "./uiLoadingMessage"
import type { UIMetaHelper } from "./uiMetaHelper"

enum CssClass
{
	uiViewLoading = `uiViewLoading`,
}

export class UIViewLoading implements UI.Styled<CssClass>, RedomComponent
{
	public id: string

	public el: HTMLElement

	public classes?: Record<CssClass, string>

	constructor( private helper: UIMetaHelper )
	{
		this.id = `UIViewLoading`

		this.el = el( `div`, new UILoadingMessage( this.helper, `App is loading` ) )

		this.styles = this.styles.bind( this )

		this.helper.getCSSClasses( this )

		this.helper.setCss( this.el, this, CssClass.uiViewLoading )
	}

	public styles(): Partial<Styles<CssClass>>
	{
		return {
			uiViewLoading: {
				position: `relative`,
				padding: `0.5rem`,
				minHeight: `100%`,
				transform: `translateZ(0)`,
				display: `grid`,
				placeItems: `center`,
				'@media (max-width: 766px)': {
					paddingBottom: `3rem`
				}
			},
		}
	}

	public styleVars(): Record<string, string>
	{
		return {}
	}
}