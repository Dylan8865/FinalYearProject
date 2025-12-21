-- Insert Sample Data into item-data table
-- Run this in Supabase SQL Editor

-- Set island_item_id to NULL since we don't have island-item records yet
-- The foreign key constraint allows NULL values

INSERT INTO public."item-data" (type, content, valid, island_item_id, order_index, parent_id, properties) VALUES
-- AI/Neural Networks content
('text', '{"url": "https://en.wikipedia.org/wiki/Artificial_neural_network", "title": "Introduction to Neural Networks", "description": "Neural networks are computing systems inspired by biological neural networks. They consist of interconnected nodes (neurons) organized in layers."}', true, NULL, 1, NULL, '{}'),

('image', '{"url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Colored_neural_network.svg/1200px-Colored_neural_network.svg.png", "title": "Neural Network Architecture Diagram", "description": "Visual representation of a multi-layer neural network showing input, hidden, and output layers"}', true, NULL, 2, NULL, '{}'),

('text', '{"url": "https://en.wikipedia.org/wiki/Backpropagation", "title": "Backpropagation Algorithm", "description": "Backpropagation calculates gradients for training neural networks using the chain rule of calculus."}', true, NULL, 3, NULL, '{}'),

-- Music Theory content
('text', '{"url": "https://en.wikipedia.org/wiki/Scale_(music)", "title": "Understanding Musical Scales", "description": "Major and minor scales form the foundation of Western music, defining the tonal relationships between notes."}', true, NULL, 4, NULL, '{}'),

('image', '{"url": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Major_scale_on_C.png/800px-Major_scale_on_C.png", "title": "Major Scale Diagram", "description": "C major scale notation showing whole and half step intervals"}', true, NULL, 5, NULL, '{}'),

-- Cooking content
('text', '{"url": "https://en.wikipedia.org/wiki/Maillard_reaction", "title": "The Science of Maillard Reaction", "description": "Chemical reaction between amino acids and reducing sugars that gives browned food its distinctive flavor and aroma."}', true, NULL, 6, NULL, '{}'),

('image', '{"url": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Spaghetti_aglio_olio_e_peperoncino.jpg/1200px-Spaghetti_aglio_olio_e_peperoncino.jpg", "title": "Perfect Pasta Dish", "description": "Example of properly cooked al dente spaghetti with oil and garlic"}', true, NULL, 7, NULL, '{}'),

('text', '{"url": "https://en.wikipedia.org/wiki/Culinary_knife_skills", "title": "Essential Knife Skills", "description": "Proper knife techniques for julienne, dice, chiffonade, and other fundamental cuts."}', true, NULL, 8, NULL, '{}'),

-- Chess content
('text', '{"url": "https://en.wikipedia.org/wiki/Chess_opening", "title": "Understanding Chess Opening Principles", "description": "Fundamental principles: control the center, develop pieces efficiently, castle early for king safety, avoid moving the same piece twice."}', true, NULL, 9, NULL, '{}'),

('text', '{"url": "https://en.wikipedia.org/wiki/Sicilian_Defence", "title": "Sicilian Defense: Najdorf Variation", "description": "One of the sharpest responses to 1.e4, featuring dynamic counterplay, tactical complexity, and fighting chances for Black."}', true, NULL, 10, NULL, '{}'),

-- Painting/Art content
('text', '{"url": "https://en.wikipedia.org/wiki/Color_wheel", "title": "Color Theory: The Color Wheel", "description": "Understanding primary, secondary, tertiary, complementary, and analogous colors for effective composition."}', true, NULL, 11, NULL, '{}'),

('image', '{"url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/BYR_color_wheel.svg/1200px-BYR_color_wheel.svg.png", "title": "Color Wheel Diagram", "description": "Visual representation of color relationships and harmonies"}', true, NULL, 12, NULL, '{}'),

('text', '{"url": "https://en.wikipedia.org/wiki/Perspective_(graphical)", "title": "Perspective Drawing: One-Point Perspective", "description": "Using a single vanishing point on the horizon line to create realistic depth in drawings."}', true, NULL, 13, NULL, '{}'),

-- Computer Science content
('text', '{"url": "https://en.wikipedia.org/wiki/Big_O_notation", "title": "Big O Notation Explained", "description": "Understanding algorithm complexity: O(1) constant, O(log n) logarithmic, O(n) linear, O(n²) quadratic, O(2ⁿ) exponential"}', true, NULL, 14, NULL, '{}'),

('text', '{"url": "https://en.wikipedia.org/wiki/Binary_search_algorithm", "title": "Binary Search Algorithm", "description": "Efficient O(log n) search algorithm for sorted arrays using divide-and-conquer approach"}', true, NULL, 15, NULL, '{}'),

-- Photography content
('text', '{"url": "https://en.wikipedia.org/wiki/Exposure_(photography)", "title": "Exposure Triangle: Aperture, Shutter Speed, ISO", "description": "Three interconnected elements that control image brightness, depth of field, motion blur, and noise."}', true, NULL, 16, NULL, '{}'),

('text', '{"url": "https://en.wikipedia.org/wiki/Rule_of_thirds", "title": "Rule of Thirds Composition", "description": "Dividing the frame into a 3x3 grid and placing subjects along the lines or intersections for balanced composition."}', true, NULL, 17, NULL, '{}');

-- Verify insertion
SELECT COUNT(*) as total_records, 
       COUNT(CASE WHEN valid = true THEN 1 END) as valid_records
FROM public."item-data";
