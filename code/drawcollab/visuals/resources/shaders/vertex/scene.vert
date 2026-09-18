#version 150 core

in vec2 position;

out vec3 Color;

uniform vec3 color;

void main( )
{
    Color       = color;

    float clipx = position.x * 2.0 - 1.0;
    float clipy = position.y * 2.0 - 1.0;
    gl_Position = vec4( clipx, clipy, 0.0, 1.0 );

    // gl_PointSize = 3.0;
}
