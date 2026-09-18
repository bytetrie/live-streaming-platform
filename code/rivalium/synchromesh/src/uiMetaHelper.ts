import jss, { StyleSheet } from "jss"
import preset from "jss-preset-default"

export interface UIMetaHelperHandler
{
	onUpdateStyleVars: ( vars: StyleVars ) => void
}

export type StyleVars = Record<string, {id: string, value: string}>

export class UIMetaHelper
{
	private styleVars: StyleVars

	private sheets: Record<string, StyleSheet>
	
	constructor(
		private handler: UIMetaHelperHandler
	)
	{
		jss.setup( preset() )

		this.styleVars = {}

		this.sheets = {}
	}

	private updateStyleVars( vars: Record<string, string>, id: string )
	{
		const sv: StyleVars = {}

		for ( const key in vars )
		{
			sv[ key ] = { id, value: vars[ key ] }
		}

		Object.assign( this.styleVars, sv )

		this.handler.onUpdateStyleVars( this.styleVars )
	}

	public updateVar( key: string, value: string ): void
	{
		this.styleVars[ key ].value = value

		this.sheets[ this.styleVars[ key ].id ].update( { [ key ]: value } )
	}

	public setCss<T extends string>( el: HTMLElement, component: UI.Styled<T>, cssClass: T ): void
	{
		if ( component.classes && cssClass in component.classes )
			el.classList.add( component.classes[ cssClass ] )
		else 
			throw Error( `No css class ${cssClass}.` )
	}

	public unsetCss<T extends string>( el: HTMLElement, component: UI.Styled<T>, cssClass: T ): void
	{
		if ( component.classes && cssClass in component.classes )
		{
			if ( el.classList.contains( component.classes[ cssClass ] ) )
				el.classList.remove( component.classes[ cssClass ] )
		}
		else 
			throw Error( `No css class ${cssClass}.` )
	}
	
	public getCSSClasses<T extends string>( component: UI.Styled<T> ): void
	{
		if ( this.sheets[ component.id ] )
		{
			component.classes = this.sheets[ component.id ].classes as Record<T, string>

			return
		}

		const sheet = jss.createStyleSheet( 
			component.styles(), 
			{ 
				classNamePrefix: `synchromesh--`,
				link: true 
			} ).attach()

		this.sheets[ component.id ] = sheet

		component.classes = sheet.classes as Record<T, string>

		if ( !component.styleVars ) return

		const vars = component.styleVars()

		this.updateStyleVars( vars, component.id )

		sheet.update( vars )
	}

	public getElOrThrow<T extends HTMLElement>( selector: string ): T
	{
		const element = document.querySelector<T>( selector )

		if ( !element )
		{
			throw Error( `Couldn't find element ${selector}` )
		}

		return element
	}
}