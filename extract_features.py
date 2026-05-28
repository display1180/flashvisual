import librosa
import numpy as np
import json

def extract_features(file_path):
    # 1. 오디오 파일 로드 (sr=None은 원본 샘플 레이트 유지)
    print(f"Loading {file_path}...")
    y, sr = librosa.load(file_path, sr=None)

    # 2. 템포와 비트 트래킹 (리듬 시각화용)
    print("Extracting tempo and beats...")
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
    beat_times = librosa.frames_to_time(beat_frames, sr=sr).tolist()

    # 3. RMS Energy 추출 (음압/볼륨 시각화용)
    print("Extracting RMS Energy...")
    rms = librosa.feature.rms(y=y)
    rms_times = librosa.frames_to_time(range(len(rms[0])), sr=sr).tolist()
    rms_values = rms[0].tolist()

    # 4. Chroma Feature 추출 (음높이/화성 시각화용 - '청각의 시각화' 핵심)
    print("Extracting Chroma Features...")
    chroma = librosa.feature.chroma_stft(y=y, sr=sr)
    chroma_avg = chroma.mean(axis=1).tolist() # 12음계별 평균 에너지

    # 5. 데이터 구조화
    print("Structuring data...")
    # librosa < 0.10 returned a float for tempo, newer returns an array. Let's make sure it's a float.
    tempo_val = float(tempo[0]) if isinstance(tempo, np.ndarray) else float(tempo)

    data = {
        "metadata": {
            "tempo": tempo_val,
            "duration": float(librosa.get_duration(y=y, sr=sr))
        },
        "beats": beat_times,
        "volume": {
            "times": rms_times[::10], # 데이터 경량화를 위해 10프레임당 1개씩 샘플링
            "values": rms_values[::10]
        },
        "tonality": chroma_avg
    }

    # 6. JSON 파일로 저장
    out_file = 'music_features.json'
    with open(out_file, 'w') as f:
        json.dump(data, f, indent=4)

    print(f"특징점 추출 완료: {out_file}")

# 실행
extract_features('Hiroshi Yoshimura - CREEK.mp3')
