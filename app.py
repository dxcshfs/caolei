from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/new_game', methods=['POST'])
def new_game():
    rows = int(request.json.get('rows', 10))
    cols = int(request.json.get('cols', 10))
    mines = int(request.json.get('mines', 10))
    
    # 这里可以添加验证逻辑，确保雷数不超过格子数等
    if mines >= rows * cols:
        return jsonify({'error': '雷数不能大于或等于格子总数'}), 400
    
    return jsonify({
        'rows': rows,
        'cols': cols,
        'mines': mines,
        'status': 'success'
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=500)