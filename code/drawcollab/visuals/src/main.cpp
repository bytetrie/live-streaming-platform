#include "app/app.hpp"

int main( int, char*[] )
{
    App app = App( );

    if ( app.run( ) )
    {
        return EXIT_SUCCESS;
    }
    else
    {
        return EXIT_FAILURE;
    }
}