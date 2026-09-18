#ifndef DATA_MANAGER_H
#define DATA_MANAGER_H

#include <iostream>
extern "C" {
#include "hiredis/hiredis.h"
}

class DataManager
{
  private:
    redisContext* context;
    void freeData( );

  public:
    float** buff;
    int totalBufferSize;
    int* size;
    int users;
    int _users;
    bool lock;

    DataManager( );
    ~DataManager( );
    void update( );
};

#endif