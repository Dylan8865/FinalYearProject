import { Html } from "@react-three/drei";

const ItemTooltip = ({ title, description }: { title: string; description: string }) => (
    <Html
        position={[0, 1.2, 0]}
        center
        distanceFactor={10}
        zIndexRange={[100, 0]}
        style={{ pointerEvents: 'none' }}
    >
        <div 
            style={{
                background: 'rgba(17, 24, 39, 0.95)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '6px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(75, 85, 99, 0.5)',
                minWidth: '100px',
                textAlign: 'center',
                whiteSpace: 'nowrap'
            }}
        >
            <div style={{ marginBottom: '2px' }}>{title}</div>
            <div style={{ 
                fontSize: '11px', 
                color: '#9ca3af',
                textTransform: 'capitalize'
            }}>
                {description}
            </div>
        </div>
    </Html>
)

export default ItemTooltip;