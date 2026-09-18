#version 150 core

in vec3 Color;

out vec4 outColor;

void main( )
{
    // outColor = vec4( 0.2, 1.0, 0.5, 1.0 );
    outColor = vec4( Color, 1.0 );
}
