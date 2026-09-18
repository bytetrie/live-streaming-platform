import type { Styles } from "jss"
import { el, RedomComponent, setChildren } from "redom"
import type { UIMetaHelper } from "./uiMetaHelper"

enum CssClass
{
	uiHelpBubble = `uiHelpBubble`,
	uiHelpBubbleHide = `uiHelpBubbleHide`,
	uiHelpBubbleUpLeft = `uiHelpBubbleUpLeft`,
	uiHelpBubbleUpRight = `uiHelpBubbleUpRight`,
	uiHelpBubbleDownLeft = `uiHelpBubbleDownLeft`,
	uiHelpBubbleDownRight = `uiHelpBubbleDownRight`
}

type Content = ( HTMLElement | RedomComponent )[]

export interface UIHelpBubbleUpdateData
{
	content?: Content
	visible?: boolean
}

export enum BubbleCaret
{
	upLeft,
	upRight,
	downLeft,
	downRight
}

export class UIHelpBubble implements UI.Styled<CssClass>, RedomComponent
{
	public id: string

	public el: HTMLElement

	public classes?: Record<CssClass, string>

	private visible: boolean

	constructor( private helper: UIMetaHelper, content?: Content, caret: BubbleCaret = BubbleCaret.upLeft )
	{
		this.id = `UIHelpBubble`

		this.el = el( `aside`, { 'data-bubble': true } )

		this.visible = false

		if ( content ) this.update( { content } )

		this.styles = this.styles.bind( this )

		this.helper.getCSSClasses( this )

		this.helper.setCss( this.el, this, CssClass.uiHelpBubble )

		this.helper.setCss( this.el, this, CssClass.uiHelpBubbleHide )

		switch( caret )
		{
			case BubbleCaret.upLeft:

				this.helper.setCss( this.el, this, CssClass.uiHelpBubbleUpLeft )

				break

			case BubbleCaret.upRight:

				this.helper.setCss( this.el, this, CssClass.uiHelpBubbleUpRight )

				break

			case BubbleCaret.downLeft:

				this.helper.setCss( this.el, this, CssClass.uiHelpBubbleDownLeft )

				break

			case BubbleCaret.downRight:

				this.helper.setCss( this.el, this, CssClass.uiHelpBubbleDownRight )

				break
		}
	}

	public update( data: UIHelpBubbleUpdateData ): this
	{
		if ( data.content )
		{
			setChildren( this.el, data.content )
		}

		if ( data.visible !== undefined && data.visible !== this.visible )
		{
			this.visible = data.visible

			if ( this.visible )
				this.helper.unsetCss( this.el, this, CssClass.uiHelpBubbleHide )
			else
				this.helper.setCss( this.el, this, CssClass.uiHelpBubbleHide )
		}

		return this
	}

	public styles(): Partial<Styles<CssClass>>
	{
		return {
			uiHelpBubble: {
				padding: `1rem`,
				width: `max-content`,
				maxWidth: `30rem`,
				border: `2px solid`,
				borderColor: data => data.helpBubbleBorder,
				borderRadius: `1rem`,
				boxShadow: `0px 1px 2px #3331`,
				background: data => data.helpBubbleBG,
				position: `relative`,
				'@media (max-width: 31rem)': {
					maxWidth: `100%`
				},
				'&:before': {
					position: `absolute`,
					display: `block`,
					content: `''`,
					width: `0`,
					height: `0`
				}
			},
			uiHelpBubbleHide: {
				display: `none`
			},
			uiHelpBubbleUpLeft: {
				marginTop: `0.8rem`,
				marginBottom: `0.2rem`,
				'&:before': {
					borderLeft: `0.75rem solid transparent`,
					borderRight: `0.75rem solid transparent`,
					borderBottom: data => `0.75rem solid ${data.helpBubbleBorder}`,
					top: `-0.75rem`
				}
			},
			uiHelpBubbleUpRight: {
				marginTop: `0.8rem`,
				marginBottom: `0.2rem`,
				'&:before': {
					borderLeft: `0.75rem solid transparent`,
					borderRight: `0.75rem solid transparent`,
					borderBottom: data => `0.75rem solid ${data.helpBubbleBorder}`,
					top: `-0.75rem`,
					right: `1rem`
				}
			},
			uiHelpBubbleDownLeft: {
				marginBottom: `0.8rem`,
				marginTop: `0.2rem`,
				'&:before': {
					borderLeft: `0.75rem solid transparent`,
					borderRight: `0.75rem solid transparent`,
					borderTop: data => `0.75rem solid ${data.helpBubbleBorder}`,
					bottom: `-0.75rem`
				}
			},
			uiHelpBubbleDownRight: {
				marginBottom: `0.8rem`,
				marginTop: `0.2rem`,
				'&:before': {
					borderLeft: `0.75rem solid transparent`,
					borderRight: `0.75rem solid transparent`,
					borderTop: data => `0.75rem solid ${data.helpBubbleBorder}`,
					bottom: `-0.75rem`,
					right: `1rem`
				}
			},
		}
	}

	public styleVars(): Record<string, string>
	{
		return {
			helpBubbleBG: `#fafafa`,
			helpBubbleBorder: `#316aac`,
		}
	}
}