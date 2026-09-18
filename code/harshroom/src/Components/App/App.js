import React from 'react';

import Harshroom from '../Harshroom/Harshroom';


export default class App extends React.Component {

    render() {
        return (

            <div className="appWrap fullHeight">

                <Harshroom {...this.props}/>

            </div>

        );
    };
};
