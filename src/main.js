
// import './style.css' // HTML側で読み込むように変更

// DOMContentLoadedのラッパーを削除（type="module"は遅延実行されるため不要＆競合回避）
const inputText = document.getElementById('inputText');
const transformBtn = document.getElementById('transformBtn');
const outputContainer = document.getElementById('outputContainer');
const placeholderText = document.getElementById('placeholderText');
const loading = document.getElementById('loading');
const resultText = document.getElementById('resultText');

console.log('Main.js loaded'); // デバッグ用

if (transformBtn) {
  transformBtn.addEventListener('click', async () => {
    console.log('Button clicked'); // デバッグ用
    const text = inputText.value.trim();

    if (!text) {
      alert('文章を入力してね！');
      return;
    }

    // UI state: loading
    transformBtn.disabled = true;
    placeholderText.classList.add('hidden');
    resultText.classList.add('hidden');
    resultText.textContent = '';
    loading.classList.remove('hidden');

    try {
      // プロキシを使わず直接指定してみる（デバッグ用）
      // プロキシ設定がうまく反映されていない可能性があるため
      const response = await fetch('http://localhost:3000/api/transform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        // エラーレスポンスがJSONかどうか確認
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errData = await response.json();
          throw new Error(errData.error || `Server error: ${response.status}`);
        } else {
          const errText = await response.text();
          throw new Error(`Server error: ${response.status} - ${errText || 'Unknown error'}`);
        }
      }

      const data = await response.json();

      // 結果表示
      resultText.textContent = data.transformedText;
      resultText.classList.remove('hidden');
      resultText.style.color = '#333'; // エラーからの復帰用

    } catch (error) {
      console.error('Error:', error);
      resultText.textContent = 'ごめんね、エラーが起きちゃった。\n' + (error.message || '不明なエラー');
      resultText.classList.remove('hidden');
      resultText.style.color = '#E53935'; // エラー色
    } finally {
      // 復帰
      loading.classList.add('hidden');
      transformBtn.disabled = false;
    }
  });
} else {
  console.error('Transform button not found!');
}
