import { Route, RouterSystem } from "./routerSystem"

export class TestSynchromeshRouter
{
	constructor( btnSelector: string, outSelector: string, urlSelector: string, dataSelector: string, baseURL: URL )
	{
		const [ button, output, url, data ] = [ btnSelector, outSelector, urlSelector, dataSelector ].map( this.getElement )

		let index = 0

		const routeDataMap: [Route, any][] = Object.entries( {
			// No data
			[ Route.recordingList ]: {},
			[ Route.listenList ]: {},
			// Id only
			[ Route.recordingItem ]: { id: `123` },
			[ Route.sourceList ]: { id: `123` },
			[ Route.listenItem ]: { id: `123` },
			[ Route.listenAdd ]: { id: `123` },
			[ Route.listenEdit ]: { id: `123` },
			// recording id and source id
			[ Route.sourceItem ]: { recordingItemID: `123`, sourceItemID: `456` },
		} ) as [Route, any][]

		const router = new RouterSystem( {
			onRouterUpdate: routeName =>
			{
				output.textContent = routeName

				const i = routeDataMap.findIndex( ( [ name ] ) => name === routeName )

				url.textContent = router.getURLForRoute( { route: routeDataMap[ i ][ 0 ], data: routeDataMap[ i ][ 1 ] } ).toString()

				data.textContent = JSON.stringify( router.dataFromURL( url.textContent ), null, 8 )

				index = ( i === routeDataMap.length - 1 ) ? 0 : i + 1
			}
		}, baseURL )

		button.addEventListener( `click`, () =>
		{
			router.update( { route: routeDataMap[ index ][ 0 ], data: routeDataMap[ index ][ 1 ] } )
		} )
	}

	private getElement( selector: string ): HTMLElement
	{
		const el = document.querySelector<HTMLElement>( selector )

		if ( !el ) throw Error( `Can't find ${el}: ${el}` )

		return el
	}
}