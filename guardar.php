<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if ($data) {
        $file = 'files/calculadora.txt';
        $existingData = json_decode(file_get_contents($file), true);

        if ($existingData) {
            // Actualizar solo el producto seleccionado
            $existingData['minAFinanciar'] = $data['minAFinanciar'];
            $selectedProduct = array_keys($data['productos'])[0];
            $existingData['productos'][$selectedProduct] = $data['productos'][$selectedProduct];

            if (file_put_contents($file, json_encode($existingData, JSON_PRETTY_PRINT))) {
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Error al guardar los datos']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Error al cargar los datos existentes']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Datos inválidos']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}
?>
