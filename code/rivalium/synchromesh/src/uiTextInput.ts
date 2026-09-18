import type { Styles } from "jss"
import { el, RedomComponent } from "redom"
import type { UIMetaHelper } from "./uiMetaHelper"

enum CssClass
{
	uiTextInput = `uiTextInput`,
	uiTextInputError = `uiTextInputError`
}

enum UITextInputState
{
	normal,
	error
}

export interface UITextInputHandler
{
	onInputChange?: ( value: string ) => void
}

export interface UITextInputUpdateData
{
	value?: string
	hasError?: boolean
}

export class UITextInput implements UI.Styled<CssClass>, RedomComponent
{
	public id: string

	public el: HTMLInputElement

	public classes?: Record<CssClass, string>

	private state: UITextInputState

	private value: string

	constructor( private helper: UIMetaHelper, value?: string, placeholder?: string, private handler?: UITextInputHandler )
	{
		this.id = `UITextInput`

		this.el = el( `input`, { placeholder: placeholder ?? `` } )

		this.state = UITextInputState.normal

		this.value = value ?? ``

		this.el.value = this.value

		this.styles = this.styles.bind( this )

		this.helper.getCSSClasses( this )

		this.helper.setCss( this.el, this, CssClass.uiTextInput )

		this.handleInput = this.handleInput.bind( this )

		this.el.addEventListener( `keyup`, this.handleInput )
	}

	private handleInput()
	{
		if ( this.value === this.el.value ) return
		
		this.value = this.el.value

		if ( this.handler?.onInputChange ) this.handler.onInputChange( this.value )
	}

	private setValue( value: string ): void
	{
		this.el.value = value

		this.handleInput()
	}

	private setError( hasError: boolean ): this
	{
		if ( hasError && this.state !== UITextInputState.error )
		{
			this.state = UITextInputState.error

			this.helper.setCss( this.el, this, CssClass.uiTextInputError )
		}
		else if ( !hasError && this.state === UITextInputState.error )
		{
			this.state = UITextInputState.normal

			this.helper.unsetCss( this.el, this, CssClass.uiTextInputError )
		}

		return this
	}

	public update( { hasError, value }: UITextInputUpdateData ): this
	{
		if ( value !== undefined ) this.setValue( value )

		if ( hasError !== undefined ) this.setError( hasError )
		
		return this
	}

	public styles(): Partial<Styles<CssClass>>
	{
		return {
			uiTextInput: {
				width: `100%`,
				fontSize: `1rem`,
				padding: `0.5rem`,
				border: `1px solid`,
				borderTopWidth: `2px`,
				borderColor: data => data.textInputBorder,
				borderRadius: `0.2rem`,
				background: data => data.textInputBG,
				color: data => data.textInput,
				transition: `background-color 500ms ease-out`,
				'&:focus': {
					background: data => data.textInputFocusBG
				}
			},
			uiTextInputError: {
				background: data => data.textInputErrorBG,
				borderColor: data => data.textInputErrorBorder
			}
		}
	}

	public styleVars(): Record<string, string>
	{
		return {
			textInputBG: `#dfefff`,
			textInputFocusBG: `#b0f0ff`,
			textInputBorder: `#aaa`,
			textInput: `#111`,
			textInputErrorBG: `#ffdafa`,
			textInputErrorBorder: `#e69`,
		}
	}
}	