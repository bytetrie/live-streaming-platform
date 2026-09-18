import type { Styles } from "jss"
import { el, RedomComponent } from "redom"
import type { UIMetaHelper } from "./uiMetaHelper"

enum CssClass
{
	uiLabel = `uiLabel`,
	uiLabelBlue = `uiLabelBlue`,
	uiLabelGrey = `uiLabelGrey`,
	uiLabelRed = `uiLabelRed`,
}

export enum UILabelColor
{
	grey,
	blue,
	red
}

export interface UILabelUpdateData
{
	color?: UILabelColor
	text?: string
}

export class UILabel implements UI.Styled<CssClass>, RedomComponent
{
	public id: string

	public el: HTMLElement

	public classes?: Record<CssClass, string>

	private inner: HTMLSpanElement

	constructor( private helper: UIMetaHelper, private color: UILabelColor, text: string )
	{
		this.id = `UILabel`

		this.inner = el( `span`, text )

		this.el = el( `span`, this.inner )

		this.styles = this.styles.bind( this )

		this.helper.getCSSClasses( this )

		this.helper.setCss( this.el, this, CssClass.uiLabel )

		this.setColor()
	}

	private setColor()
	{
		this.inner.className = ``

		switch( this.color )
		{
			case UILabelColor.blue:

				this.helper.setCss( this.inner, this, CssClass.uiLabelBlue )

				break

			case UILabelColor.grey:

				this.helper.setCss( this.inner, this, CssClass.uiLabelGrey )

				break

			case UILabelColor.red:

				this.helper.setCss( this.inner, this, CssClass.uiLabelRed )

				break
		}
	}

	public update( { color, text }: UILabelUpdateData ): this
	{
		if ( color !== undefined && color !== this.color )
		{
			this.color = color
	
			this.setColor()
		}
		
		if ( text !== undefined ) this.inner.textContent = text

		return this
	}

	public styles(): Partial<Styles<CssClass>>
	{
		return {
			uiLabel: {
				'& > span': {
					padding: `0.2rem 0.5rem`,
					borderRadius: `0.2rem`,
					fontSize: `0.8rem`,
					fontWeight: `600`
				}
			},
			uiLabelBlue: {
				background: data => data.labelBlueBG,
				color: data => data.labelBlueText
			},
			uiLabelGrey: {
				background: data => data.labelGreyBG,
				color: data => data.labelGreyText
			},
			uiLabelRed: {
				background: data => data.labelRedBG,
				color: data => data.labelRedText
			},
		}
	}

	public styleVars(): Record<string, string>
	{
		return {
			labelBlueBG: `#316aac`,
			labelBlueText: `#fafafa`,
			labelGreyBG: `#bbb`,
			labelGreyText: `#555`,
			labelRedBG: `#DC3C50`,
			labelRedText: `#fafafa`,

		}
	}
}