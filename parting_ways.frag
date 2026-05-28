#ifdef GL_ES
precision highp float;
#endif

// 최대 지원 세포 수 (GPU 연산 최적화를 위해 40개로 제한)
#define MAX_CELLS 40

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_energy; // 스무딩된 오디오 에너지
uniform float u_flash;  // 날카로운 비트 타격 플래시 (심장박동용)
uniform int u_cell_count;
uniform vec2 u_positions[MAX_CELLS]; // 셰이더로 전달될 세포들의 위치 배열

varying vec2 vTexCoord;

// --- 유기적 융합을 위한 Smooth Minimum (smin) 함수 ---
// k값이 클수록 끈적하게 달라붙습니다 (Parting Ways의 핵심)
float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

// 2D 회전 매트릭스 (전체 공간의 꿈틀거림 표현용)
mat2 rotate2d(float _angle){
    return mat2(cos(_angle), -sin(_angle),
                sin(_angle), cos(_angle));
}

void main() {
    // 화면 좌표계를 중앙(0,0)으로 맞추고 비율(Aspect Ratio) 보정
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st = st * 2.0 - 1.0;
    st.x *= u_resolution.x / u_resolution.y;

    // 전체 공간을 천천히 회전시켜 심해의 생명체처럼 유기적인 움직임 부여
    st = rotate2d(sin(u_time * 0.1) * 0.2) * st;

    // --- 세포(원) 거리 계산 및 끈적한 융합(smin) 연산 ---
    float organicDist = 100.0; // 초기 거리값 (아주 먼 거리)
    float minDistToCenter = 100.0; // 각 세포의 중심으로부터의 최소 거리 (개별 세포 입체감용)

    // 모든 세포를 순회하며 거리를 병합합니다.
    for (int i = 0; i < MAX_CELLS; i++) {
        // 성능 최적화: 현재 존재하는 세포 개수까지만 계산하고 반복문 탈출 (렉 방지)
        if (i >= u_cell_count) break;
        
        vec2 cellPos = u_positions[i];
        
        // 각 세포의 크기: 비트에 맞춰 쫀득하게 팽창하며 약간 줄여서 클러스터가 잘 보이게 함
        // u_flash 팽창을 약간 줄여서 눈부심과 과도한 뭉침을 완화
        float radius = 0.05 + u_energy * 0.06 + u_flash * 0.06 + sin(u_time * 2.0 + float(i)) * 0.015;
        
        // 현재 픽셀(st)과 세포 중심(cellPos) 사이의 거리
        float distToCenter = length(st - cellPos);
        
        // 표면까지의 거리 (SDF 공식)
        float d = distToCenter - radius;
        
        // 거리를 smin으로 누적 융합
        if (i == 0) {
            organicDist = d;
        } else {
            // k값을 0.08로 대폭 낮춰서, 사실상 서로 겹쳐있는 구체들처럼 보이게 함
            organicDist = smin(organicDist, d, 0.08 + u_energy * 0.02); 
        }
        
        // 각 세포의 독립성을 시각화하기 위해 중심부까지의 거리 누적 (Voronoi 스타일)
        minDistToCenter = min(minDistToCenter, distToCenter);
    }

    // --- 시각적 렌더링 (세포막, 코어, 배경) ---
    // 거리가 0 근처면 세포막(경계), 음수면 내부, 양수면 외부입니다.
    float membrane = smoothstep(0.01, -0.01, organicDist);
    
    // 외곽선에 강한 글로우(Glow) 효과 추가
    float glow = 0.015 / abs(organicDist + 0.01);
    
    // 깊이감을 위한 내부 셰이딩 
    // 기존에는 하나의 큰 덩어리(organicDist)를 기준으로 음영을 주었으나,
    // 이제는 각 세포의 중심(minDistToCenter)을 기준으로 음영을 주어 
    // 하나하나가 독립된 구슬(세포)처럼 보이게 만듭니다.
    float innerShade = smoothstep(0.0, 0.07, minDistToCenter);

    // --- 색상 팔레트 ---
    // Parting Ways 특유의 차갑고 유기적인 생물 발광(Bioluminescence) 느낌
    vec3 coreColor = vec3(0.05, 0.15, 0.25);   // 깊은 세포 내부 (다크 블루)
    vec3 edgeColor = vec3(0.2, 0.8, 1.0);      // 세포막 근처 (청록색)
    vec3 glowColor = vec3(0.4, 0.9, 1.0);      // 빛나는 아우라 (밝은 시안)
    vec3 bgColor   = vec3(0.01, 0.01, 0.03);   // 어두운 배경
    
    // 드럼(비트) 타격 시 심장처럼 번쩍이는 효과 (너무 눈부시지 않게 수치 하향 조정)
    vec3 hitColor = vec3(0.6, 0.2, 0.4) * u_flash * 0.5;
    coreColor += hitColor * 0.3; // 코어 내부 은은하게
    edgeColor += hitColor * 0.8; // 세포막 은은하게
    glowColor += hitColor;       // 주변 아우라 은은하게

    // 최종 색상 조합
    vec3 finalColor = bgColor;
    // 세포 내부 색상 (코어 -> 엣지 그라데이션)
    vec3 cellColor = mix(coreColor, edgeColor, innerShade);
    finalColor = mix(finalColor, cellColor, membrane);
    
    // 글로우 더하기 (눈 아프지 않게 플래시 가중치 대폭 감소)
    finalColor += glowColor * glow * (0.6 + u_flash * 0.3);
    
    // 미세한 노이즈 텍스처 (아주 약하게 추가하여 밴딩 현상 완화)
    float noise = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) * 0.02;
    finalColor += noise;

    gl_FragColor = vec4(finalColor, 1.0);
}
