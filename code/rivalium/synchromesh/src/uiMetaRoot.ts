import type { Styles } from "jss"
import type { RedomComponent } from "redom"
import type { UIMetaHelper } from "./uiMetaHelper"

enum CssClass
{
	uiMetaRoot = `uiMetaRoot`,
	global = `@global`
}

export class UIMetaRoot implements UI.Styled<CssClass>, RedomComponent
{
	public id: string

	public el: HTMLElement

	public classes?: Record<CssClass, string>

	constructor( private helper: UIMetaHelper, selector: string )
	{
		this.id = `UIMetaRoot`

		this.el = this.helper.getElOrThrow( selector )

		this.styles = this.styles.bind( this )

		this.helper.getCSSClasses( this )

		this.helper.setCss( this.el, this, CssClass.uiMetaRoot )
	}

	public styles(): Partial<Styles<CssClass>>
	{
		return {
			uiMetaRoot: {
				background: data => data.metarootBG,
				position: `relative`,
				height: `100%`,
				overflow: `auto`,
				// width: `100%`
			},
			[ CssClass.global ]: {
				body: {
					'& *': {
						boxSizing: `border-box`,
						fontSize: `16px`,
						fontFamily: `Arial, sans-serif`
					}
				}
			}
		}
	}

	public styleVars(): Record<string, string>
	{
		return {
			metarootBG: `#eee`
		}
	}
}