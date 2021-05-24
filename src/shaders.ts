export const Shaders = () => {
    const vertex = `
        [[block]] struct Uniforms {
            [[offset(0)]] mvpMatrix : mat4x4<f32>;
        };
        [[binding(0), group(0)]] var<uniform> uniforms : Uniforms;
        [[location(0)]] var<in> pos : vec4<f32>;
        [[location(1)]] var<in> color : vec3<f32>;
        [[builtin(position)]] var<out> Position : vec4<f32>;
        [[location(0)]] var<out> vColor : vec3<f32>;

        [[stage(vertex)]]
        fn main() -> void {
            Position = uniforms.mvpMatrix * pos;
            vColor = color;
            return;
        }`;

    const fragment = `
        [[location(0)]] var<in> vColor : vec3<f32>;
        [[location(0)]] var<out> fragColor : vec4<f32>;

        [[stage(fragment)]]
        fn main() -> void {
            fragColor = vec4<f32>(vColor, 1.0);
            return;
        }`;

    return {
        vertex, 
        fragment
    };
}
