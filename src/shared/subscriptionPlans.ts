export const FREE = {
  name: "FREE",
  maxStudents: 20,
  price: 0
};

export const BRONZE = {
  name: "BRONZE",
  maxStudents: 50,
  price: 20
};

export const SILVER = {
  name: "SILVER",
  maxStudents: 80,
  price: 30
};

export const BLACK_BELT = {
  name: "BLACK_BELT",
  maxStudents: 999999, // unlimited or high limit
  price: 50
};

export const getPlanByStudentCount = (count: number) => {
  if (count <= 20) {
    return FREE;
  } else if (count <= 50) {
    return BRONZE;
  } else if (count <= 80) {
    return SILVER;
  } else {
    return BLACK_BELT;
  }
};
