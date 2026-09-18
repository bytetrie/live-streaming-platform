#include "dataManager.hpp"
#include <iostream>
#include <string>

DataManager::DataManager( )
{
    redisContext* c = redisConnect( "127.0.0.1", 6379 );
    if ( c == NULL || c->err )
    {
        if ( c )
        {
            printf( "Error: %s\n", c->errstr );
            // handle error
        }
        else
        {
            printf( "Can't allocate redis context\n" );
        }
        return;
    }

    context         = c;
    users           = 0;
    _users          = 0;
    size            = NULL;
    buff            = NULL;
    lock            = false;
    totalBufferSize = 0;
}

DataManager::~DataManager( )
{
    freeData( );
    redisFree( context );
}

void DataManager::freeData( )
{
    if ( _users > 0 )
    {
        for ( int i = 0; i < _users; ++i )
        {
            delete[] buff[ i ];
        }

        delete[] size;
        delete[] buff;

        users  = 0;
        _users = 0;
    }
}

void printTime( std::chrono::time_point<std::chrono::steady_clock,
                                        std::chrono::nanoseconds>& t_start,
                std::chrono::time_point<std::chrono::steady_clock,
                                        std::chrono::nanoseconds>& t_last,
                std::string desc )
{
    auto t_now = std::chrono::high_resolution_clock::now( );

    float timeSinceStart =
        std::chrono::duration_cast<std::chrono::duration<float>>( t_now -
                                                                  t_start )
            .count( );

    float timeSinceLast =
        std::chrono::duration_cast<std::chrono::duration<float>>( t_now -
                                                                  t_last )
            .count( );

    std::cout << "Time for " << desc << ". Since start: " << timeSinceStart
              << ". Since last: " << timeSinceLast << std::endl;
    t_last = t_now;
}

void DataManager::update( )
{
    if ( lock )
    {
        return;
    }

    lock = true;
    // std::cout << "\n\n" << std::endl;

    // auto t_start = std::chrono::high_resolution_clock::now( );
    // auto t_last  = t_start;

    freeData( );
    // printTime( t_start, t_last, "freeing data" );

    void* pointer = NULL;

    redisReply* reply;
    pointer = redisCommand( context, "GET users" );
    reply   = (redisReply*)pointer;

    // printTime( t_start, t_last, "getting users" );

    if ( reply->type == REDIS_REPLY_ERROR )
    {
        printf( "Error: %s\n", reply->str );
        freeReplyObject( reply );
        return; // Throw?
    }
    else if ( reply->type == REDIS_REPLY_NIL ||
              reply->type != REDIS_REPLY_STRING )
    {
        freeReplyObject( reply );
        return; // Throw?
    }

    // users = atoi( reply->str );
    _users = atoi( reply->str );
    freeReplyObject( reply );

    // printTime( t_start, t_last, "check and free user reply object" );
    // buff = new float*[ users ];
    // size = new int[ users ];
    buff = new float*[ _users ];
    size = new int[ _users ];

    users           = 0;
    totalBufferSize = 0;
    // buff            = new float*[ 10 ];
    // size            = new int[ 10 ];

    char buffer[ 20 ];
    // redisReply* reply;

    // for ( int i = 0; i < users; i++ )
    for ( int i = 0; i < _users; i++ )
    // for ( int i = 0; i < 10; i++ )
    {
        // std::string user = "user " + std::to_string( i );
        // printTime( t_start, t_last, user );
        memset( buffer, 0, sizeof buffer );
        // printTime( t_start, t_last, "null command buffer" );
        // sprintf( buffer, "LRANGE %d 0 -1", i );
        sprintf( buffer, "LRANGE %d 0 -1", 0 );
        // printTime( t_start, t_last, "set command buffer" );
        pointer = redisCommand( context, buffer );
        reply   = (redisReply*)pointer;
        // printTime( t_start, t_last, "got vector data" );

        if ( reply->type == REDIS_REPLY_ERROR )
        {
            printf( "Error: %s\n", reply->str );
        }
        else if ( reply->type != REDIS_REPLY_ARRAY )
        {
            printf( "Unexpected type: %d\n", reply->type );
        }
        else
        {
            // printTime( t_start, t_last, "pre-inner loop before buffer" );
            users += 1;
            totalBufferSize += reply->elements;
            buff[ i ] = new float[ reply->elements ];
            // printTime( t_start, t_last, "pre-inner loop after buffer" );
            for ( int j = 0; j < reply->elements; j++ )
            // for ( int j = 0; j < 1; j++ ) // 600 before lag
            {
                // printTime( t_start, t_last, "convert string to float" );
                float x = strtof( reply->element[ j ]->str, NULL );
                // printTime( t_start,
                //            t_last,
                //            "converted string to float, setting buffer" );
                buff[ i ][ j ] = x;
                // printTime( t_start, t_last, "set buffer" );
            }
            size[ i ] = reply->elements;
            // printTime( t_start, t_last, "set size" );
        }

        freeReplyObject( reply ); // slow
        // printTime( t_start, t_last, "after free reply object, end user loop"
        // );
    }

    lock = false;

    // printTime( t_start, t_last, "total update" );
    // std::cout << "\n\n" << std::endl;
}
