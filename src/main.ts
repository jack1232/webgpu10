import { InitGPU, CreateGPUBuffer, CreateTransforms, CreateViewProjection } from './helper';
import { Shaders } from './shaders';
import { CubeData } from './vertex_data';
import { mat4 } from 'gl-matrix';

const Create3DObject = async () => {
    const gpu = await InitGPU();
    const device = gpu.device;

    // create vertex buffers
    const cubeData = CubeData();
    const numberOfVertices = cubeData.positions.length / 3;
    const vertexBuffer = CreateGPUBuffer(device, cubeData.positions);
    const colorBuffer = CreateGPUBuffer(device, cubeData.colors);
 
    const shader = Shaders();
    const pipeline = device.createRenderPipeline({
        vertex: {
            module: device.createShaderModule({                    
                code: shader.vertex
            }),
            entryPoint: "main",
            buffers:[
                {
                    arrayStride: 12,
                    attributes: [{
                        shaderLocation: 0,
                        format: "float32x3",
                        offset: 0
                    }]
                },
                {
                    arrayStride: 12,
                    attributes: [{
                        shaderLocation: 1,
                        format: "float32x3",
                        offset: 0
                    }]
                }
            ]
        },
        fragment: {
            module: device.createShaderModule({                    
                code: shader.fragment
            }),
            entryPoint: "main",
            targets: [
                {
                    format: gpu.swapChainFormat as GPUTextureFormat
                }
            ]
        },
        primitive:{
            topology: "triangle-list",
            cullMode: 'back'
        },
        depthStencil:{
            format: "depth24plus",
            depthWriteEnabled: true,
            depthCompare: "less"
        }
    });

    // create uniform data
    const modelMatrix = mat4.create();
    const mvpMatrix = mat4.create();
    let vpMatrix = mat4.create();
    const vp = CreateViewProjection(gpu.canvas.width/gpu.canvas.height);
    vpMatrix = vp.viewProjectionMatrix;

    // create uniform buffer and layout
    const uniformBuffer = device.createBuffer({
        size: 64,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    const uniformBindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: uniformBuffer,
                    offset: 0,
                    size: 64
                }
            }
        ]
    });

    const textureView = gpu.swapChain.getCurrentTexture().createView();
    const depthTexture = device.createTexture({
        size: [gpu.canvas.width, gpu.canvas.height, 1],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT
    });
    const renderPassDescription = {
        colorAttachments: [{
            view: textureView,
            loadValue: { r: 0.5, g: 0.5, b: 0.8, a: 1.0 }, //background color
            storeOp: 'store'
        }],
        depthStencilAttachment: {
            view: depthTexture.createView(),
            depthLoadValue: 1.0,
            depthStoreOp: "store",
            stencilLoadValue: 0,
            stencilStoreOp: "store"
        }
    };
    
    CreateTransforms(modelMatrix);
    mat4.multiply(mvpMatrix, vpMatrix, modelMatrix);
    device.queue.writeBuffer(uniformBuffer, 0, mvpMatrix as ArrayBuffer);

    const commandEncoder = device.createCommandEncoder();
    const renderPass = commandEncoder.beginRenderPass(renderPassDescription as GPURenderPassDescriptor);
    renderPass.setPipeline(pipeline);
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.setVertexBuffer(1, colorBuffer);
    renderPass.setBindGroup(0, uniformBindGroup);
    renderPass.draw(numberOfVertices);
    renderPass.endPass();

    device.queue.submit([commandEncoder.finish()]);
}

Create3DObject();